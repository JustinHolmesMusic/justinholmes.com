const path = require('path');

module.exports = {
    entry: {
        main: './src/index.js',
        help: './src/help.js',
        walletModal: './src/walletModal.js',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: "development",
};