const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");


module.exports = {
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html', // source html
            filename: 'index.html'        // destination html file
        }),

        // for some reason adding mp3 suffix to the regex doesn't work, so we use the copy plugin
        // TODO: figure out why
        new CopyPlugin({
                patterns: [
                    {from: 'src/audio', to: 'audio'}, 
                ]
        })
    ],
    entry: {
        main: './src/js/index.js',
        help: './src/js/help.js',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: (pathData) => {
                        // Remove the 'src/' prefix
                        const newPath = pathData.filename.replace('src/', '');
                        return newPath;
                    }
                }
            },

        ]
    },
    mode: "development",
    devtool: 'eval-source-map',
};