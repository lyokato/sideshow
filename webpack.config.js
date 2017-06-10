module.exports = {
  entry:  { js: __dirname + '/client/main.tsx' },
  output: { path: __dirname + '/public/js', filename: 'bundle.js' },
  resolve: { extensions: ['.ts', '.tsx', '.js']  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|wip)/,
        loader: 'ts-loader',
      }
    ]
  },
  devtool: 'source-map',
};
