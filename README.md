### Justin Holmes website, immutable string band and Vowel Sounds for Revealer 1

This repo contains the logic and frontend to release Justin Holmes' 'blockchain bluegrass' album, "Vowel Sounds", using Revealer, a distribution-publishing toolchain build on Threshold Network.

To build for development:

`npm run devserver`

This will start a local server at localhost:8080 and watch for changes to build.
(Note: the server is started with --no-client-overlay in a lame attempt to work around this: https://github.com/WalletConnect/walletconnect-docs/issues/762)

To build for production:

`npm run build`

To add a new page, include it in the `src/data/pages.yaml`