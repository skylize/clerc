
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin')
const LiveReload = require('webpack-watch-livereload-plugin')

console.log('env', process.env.NODE_ENV)

const plugins = ( () => {
  const all = []

  const production = [
    new CleanPlugin('build')
  ]

  const dev = [
    new LiveReload('build/*')
  ]

  return all.concat(
    process.env.NODE_ENV === 'production'
      ? production
      : dev )
})()

const version = require('./package.json').version

module.exports = {
  context: path.join(__dirname, 'src'),
  entry: {
    'background': './background.js',
    'manifest.json': './manifest.json',
    'img': './img/index.js',
    'fakie': '../fake-plugin/background.js'
  },
  plugins,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
    publicPath: '/',
  },
  module: {
    rules: [
      { // add version from package.json to manifest
        test: /manifest\.json$/,
        use: [
          'file-loader?name=manifest.json',
          'json-loader',
          {
            loader: 'str-replace-loader',
            options: {
              match: '{{version}}',
              replace: version,
            }
          }
        ],
      },
      { //copy image files
        test: /\.png|svg|jpg|gif$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
              useRelativePath: true
            }
          },{
            loader: 'image-webpack-loader',
            options: {
              optipng: {
                optimizationLevel: 7,
              },
            }
          }
        ]
      }
    ]
  }
}
