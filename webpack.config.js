const path = require('path')
const { UserscriptPlugin } = require('webpack-userscript')
const dev = process.env.NODE_ENV === 'development'

module.exports = {
  mode: dev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src', 'index.js'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: false,
  plugins: [new UserscriptPlugin({
    headers: {
      name: 'SBG Enhanced UI',
      namespace: 'https://3d.sytes.net/',
      downloadURL: 'https://github.com/egorantonov/sbg-enhanced/releases/latest/download/index.js',
      updateURL: 'https://github.com/egorantonov/sbg-enhanced/releases/latest/download/index.js',
      description: 'Enhanced UI for SBG',
      author: 'https://github.com/egorantonov',
      match: 'https://3d.sytes.net/*',
      iconURL: 'https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/script/64.png',
      icon64URL: 'https://raw.githubusercontent.com/egorantonov/sbg-enhanced/master/assets/script/64.png',
      grant: 'none'
    }
  })],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'to-string-loader',
          'css-loader'
        ]
      }
    ]
  }
}