const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const path = require("path");

module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    optimization: {
        minimizer: [new TerserPlugin()],
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    // plugins: [
    //     new MiniCssExtractPlugin({
    //         filename: '[name].[contenthash].css'
    //     }),
    // ],

    // ... Production plugins like MiniCssExtractPlugin, TerserPlugin, etc.
});