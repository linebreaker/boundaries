import censusImport from 'census-boundaries'
import neighborhoodImport from 'neighborhood-boundaries'
import fs from 'graceful-fs'
import path from 'path'
import async from 'async'
import request from 'superagent'
import camel from 'camelcase'

const writePath = path.join(__dirname, './files')

const curi = 'https://observatory.carto.com/api/v2/sql'
const getCensusData = (id, type, cb) => {
  const table = getBoundaryTable(type)
  if (!table) return cb()
  const q = `SELECT * FROM ${table} WHERE geoid = '${id}' LIMIT 1`
  console.log(q)
  request.get(curi)
    .type('json')
    .retry(1)
    .query({ q })
    .end((err, res) => {
      if (err) return cb(err.response ? err.response.text : err)
      const data = res.body.rows[0]
      if (!data) return cb()

      // delete junk
      delete data.the_geom
      delete data.the_geom_webmercator
      delete data.cartodb_id
      delete data.geoid
      const filtered = Object.keys(data).reduce((p, k) => {
        if (k.indexOf('_moe') === -1) p[camel(k)] = data[k]
        return p
      }, {})
      cb(null, filtered)
    })
}

const getPolygon = (feature) => {
  const isPolygon = feature.geometry.type === 'Polygon'
  const coords = isPolygon ?
    [ feature.geometry.coordinates ]
    : feature.geometry.coordinates

  return {
    type: 'MultiPolygon',
    coordinates: coords
  }
}

const getBoundaryTable = (type) => {
  if (type === 'STATE') return null
  if (type === 'COUNTY') return 'observatory.us_census_acs2013_5yr_county'
  if (type === 'PLACE') return null
  if (type === 'ZCTA5') return 'observatory.us_census_acs2013_5yr_zcta5'
  if (type === 'TRACT') return 'observatory.us_census_acs2013_5yr_census_tract'
  throw new Error(`Invalid type: ${type}`)
}

const getType = (type) => {
  if (type === 'STATE') return 'state'
  if (type === 'COUNTY') return 'county'
  if (type === 'PLACE') return 'city'
  if (type === 'ZCTA5') return 'zip'
  throw new Error(`Invalid type: ${type}`)
}

const write = (boundary, cb) => {
  const fileName = path.join(writePath, `${boundary.properties.id}.geojson`)
  fs.exists(fileName, (err, exists) => {
    if (exists) console.warn('Overwriting', fileName, boundary)
    fs.writeFile(fileName, JSON.stringify(boundary), cb)
  })
}

const census = (cb) => {
  censusImport({
    objects: [
      'STATE', 'COUNTY',
      'PLACE', 'ZCTA5'
    ],
    onBoundary: (type, doc, done) => {
      const data = getPolygon(doc)
      const id = doc.properties.GEOID || doc.properties.GEOID10
      if (!id) return done()
      const typeCode = getType(type)
      getCensusData(id, type, (err, census) => {
        data.properties = {
          id: `USA-${id}`,
          type: typeCode,
          name: doc.properties.FULLNAME
            || doc.properties.NAME
            || doc.properties.ZCTA5CE10
            || doc.properties.GEOID
            || doc.properties.GEOID10,
          census
        }
        write(data, done)
      })
    },
    onFinish: cb
  })
}

const neighborhoods = (cb) => {
  neighborhoodImport({
    onBoundary: (doc, done) => {
      const data = getPolygon(doc)
      const id = doc.properties.RegionID
      if (!id) return done()
      data.properties = {
        id: `USA-N${id}`,
        type: 'neighborhood',
        name: doc.properties.Name
      }
      write(data, done)
    },
    onFinish: cb
  })
}

const done = (err) => {
  if (err) return console.error(err)
  console.log('Done importing!')
  process.exit(0)
}

async.parallel([ census, neighborhoods ], done)
