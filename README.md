<p align="center">
  <img width="400" src="https://raw.githubusercontent.com/contra/boundaries/master/logos/black.png">
</p>


# boundaries [![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url]

GeoJSON boundaries for Earth, masterfully formatted and normalized for your consumption.

Total # as of writing this: **81,146**

## Sources

- Neighborhoods
  - Zillow
- US States/Cities/Counties/Zip Codes
  - Census Bureau (TIGER 2016)

Know of more good sources for boundary data? Send a PR!

## Boundary JSON Format

Each boundary is a GeoJSON MultiPolygon. The properties object on each geometry contains the following fields:

- `id` (String)
  - Unique ID for this boundary
- `type` (String)
  - state, neighborhood, county, etc.
- `name` (String)
  - Display Name

## Accessing the boundaries

You can clone the repo and read the files directly, or use the node module.

## Node Module

### Installation

Due to size limits on npm, you'll have to install from github.

`npm install contra/boundaries --save`

If anything was able to land on NPM, it's outdated - don't use it.

### API

- `listSync()`
  - Synchronous
  - Returns an array of boundary IDs
- `readSync(id)`
  - Synchronous
  - Returns the object representing the given boundary ID
- `list([cb])`
  - Asynchronous form of `listSync`
  - Callback is optional, returns a promise
- `read(id[, cb])`
  - Asynchronous form of `readSync`
  - Callback is optional, returns a promise


### Example

Simple example of listing boundaries and reading them synchronously.

#### ES5

```js
var boundaries = require('boundaries');
var fs = require('fs');

var ids = boundaries.listSync();

ids.forEach(function(id) {
  var boundary = boundaries.readSync(id);
  // Do something with it!
});
```

#### ES6

```js
import { listSync, readSync } from 'boundaries'

const ids = listSync()

ids.forEach((id) => {
  const boundary = readSync(id)
  // Do something with it!
})
```

[downloads-image]: http://img.shields.io/npm/dm/boundaries.svg
[npm-url]: https://npmjs.org/package/boundaries
[npm-image]: http://img.shields.io/npm/v/boundaries.svg
