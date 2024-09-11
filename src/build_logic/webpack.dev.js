import common from './webpack.common.js';
import webpack from 'webpack';
import {merge} from 'webpack-merge';

const devExport = merge(common, {
    devServer: {
        historyApiFallback: {
            rewrites: [
                {from: /\/$/, to: '/index.html'},
                {
                    from: /\/(.+)$/, to: function (context) {
                        // Rewrite URLs like '/things' to '/things.html'
                        return '/' + context.match[1] + '.html';
                    }
                },
            ],
        },
    },
    mode: 'development',
    devtool: 'eval-source-map',
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
        }),
    ]
});

export default devExport;