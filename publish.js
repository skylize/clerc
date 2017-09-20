const path = require('path')
const fs = require('fs')
const zipFolder = require('zip-folder')
const { promisify } = require('util')

const version = require('./package.json').version

console.log('publish')

const fsUnlink = promisify(fs.unlink)
const zip = promisify(zipFolder)

const buildDir = path.join(__dirname, 'build')
const outDir = path.join(__dirname, 'dist')

const rmExtraneous =
  Promise.all(
    [
      'img.js',
      'manifest.js',
    ].map (
      file => fsUnlink(path.join(buildDir, file))
    )
  )
    .then(
      ()=> console.log('Deleted extraneous bundles'),
      console.error,
    )

rmExtraneous
  .then(()=> {
    const file = `dist_${version}.zip`
    return zip(
      buildDir,
      path.join(outDir, file),
    )
      .then(()=> file)

  })
  .then(
    file => console.log(`Distribution saved as ${file}`),
    console.error,
  )
