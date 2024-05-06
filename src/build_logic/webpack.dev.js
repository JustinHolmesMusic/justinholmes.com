import common from './webpack.common.js';
import webpack from 'webpack';
import {merge} from 'webpack-merge';


const devExport = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
        }),
    ]
});

export default devExport;