## Justin Holmes website, immutable string band and Vowel Sounds for Revealer 1

This repo contains the logic and frontend to release Justin Holmes' 'blockchain bluegrass' album, "Vowel Sounds", using Revealer, a distribution-publishing toolchain build on Threshold Network.

To build for development:

`npm run devserver`

This will start a local server at localhost:8080 and watch for changes to build.
(Note: the server is started with --no-client-overlay in a lame attempt to work around this: https://github.com/WalletConnect/walletconnect-docs/issues/762)

To build for production:

`npm run build`

### Adding a new page
To add a new page, include it in the `src/data/pages.yaml`

If the page has a custom javascript, create a new file in `src/js/`, include it in the `webpack.common.js` file in the `entry` section and adjust the `chunks` array to inject the correct js chunk into the page template.

* Nunjucks
* Cursor rules
