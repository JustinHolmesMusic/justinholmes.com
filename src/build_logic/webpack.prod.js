import common from './webpack.common.js';
import {merge} from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import {outputDistBaseDir} from "./constants.js";

let prodExport = merge(common, {
    mode: 'production',
    optimization: {
        minimizer: [new TerserPlugin()],
    },
    output: {
        filename: '[name].bundle.js',
        path: outputDistBaseDir,
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ]
});

export default prodExport;