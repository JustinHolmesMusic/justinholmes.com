import common from './webpack.common.js';
import {merge} from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import {outputDistDir, templateDir} from "./constants.js";
import fs from "fs";
import path from "path";

let prodExport = merge(common, {
    mode: 'production',
    devtool: false,
    optimization: {
        minimizer: [new TerserPlugin()],
    },
    output: {
        filename: '[name].bundle.js',
        path: outputDistDir,
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        {
            apply: (compiler) => {
                compiler.hooks.done.tap('CopyHtaccessPlugin', () => {
                    fs.copyFileSync(path.resolve(templateDir, 'pages/.htaccess'), path.resolve(outputDistDir, '.htaccess'));
                    console.log('.htaccess file copied');
                });
            },
        },
    ]
});

export default prodExport;