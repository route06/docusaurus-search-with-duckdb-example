const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  experiments: {
    asyncWebAssembly: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'lindera-wasm': path.resolve(__dirname, 'node_modules/lindera-wasm/lindera_wasm.js')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: '' },
        { from: 'node_modules/lindera-wasm/lindera_wasm.js', to: 'lindera_wasm.js' },
        { from: 'node_modules/lindera-wasm/lindera_wasm_bg.js', to: 'lindera_wasm_bg.js' },
        { from: 'node_modules/lindera-wasm/lindera_wasm_bg.wasm', to: 'lindera_wasm_bg.wasm' },
        { from: 'node_modules/lindera-wasm/lindera_wasm.d.ts', to: 'lindera_wasm.d.ts' },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
};
