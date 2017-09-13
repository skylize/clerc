
const path = require('path')
const lr = require('webpack-livereload-plugin')

module.exports = {
  context: path.join(__dirname, 'src'),
  entry: {
    'background': './background.js',
  },
  plugins: [
    new lr({protocol: 'https'})
  ],
  output: {
    filename: 'background.js',
    path: path.resolve(__dirname, 'build'),
  }
}
