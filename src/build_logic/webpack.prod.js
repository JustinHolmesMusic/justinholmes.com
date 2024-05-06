import common from './webpack.common.js';
import {merge} from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import path from 'path';
import {fileURLToPath} from "url";

// TODO: these names can be dehydrated to at most once for all the runtimey stuff
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


let prodExport = merge(common, {
    mode: 'production',
    optimization: {
        minimizer: [new TerserPlugin()],
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ]
});

export default prodExport;