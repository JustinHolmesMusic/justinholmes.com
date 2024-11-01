This is a self-building static site, built with node.js and designed to be hosted on a static site host (currently, nearlyfreespeech.net).

On ubuntu 24.04, it requires node 22.x to build.  It doesn't yet work with > 22, primarily due to this issue: <https://github.com/Automattic/node-canvas/issues/2418>.

# To run locally:

```
nvm use 22 
npm install
npm run build
npm run start
```
