
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin')

const plugins = ( () => {
  const all = []

  const production = [
    new CleanPlugin('build'),
  ]

  const dev = []

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
    'manifest': './manifest.json',
    'img': './img/index.js',
  },
  plugins,
  devtool: (process.env.NODE_ENV !== 'production') && 'source-map',
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
          {
            loader: 'str-replace-loader',
            options: {
              match: '{version}',
              replace: version,
            },
          },
        ],
      },
      { //copy image files
        test: /\.png|svg|jpg|gif$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
              useRelativePath: true,
            },
          },{
            loader: 'image-webpack-loader',
            options: {
              optipng: {
                optimizationLevel: 7,
              },
            },
          },
        ],
      },
    ],
  },
}
