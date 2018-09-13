# rollup-plugin-webworkify

Bundles a single JS file alongside your main source code as the source for a
Web Worker. Provides a fallback for running the code in the main thread if the
browser does not support creating Workers from blobs.

inspired by [webworkify](https://github.com/substack/webworkify)

### Install

```sh
yarn add rollup-plugin-webworkify -D
```

Require the plugin and add it to your configuration:

```js
import webworkify from 'rollup-plugin-webworkify';

export default {
  entry: 'src/main.js',
  plugins: [
    webworkify({
      // specifically patten files
      pattern: '**/*.worker.js'  // Default: undefined (follow micromath globs)
    })
  ],
  format: 'umd'
};
```

### Example

For each worker that you want to create, import the file with a `worker#` prefix:

```js
// import work from 'worker#../lib/worker.js'
import work from '../lib/foo.worker.js'

var w = new work
w.addEventListener('message', function (e) {
  console.log(e.data)
})

w.postMessage(4) // send the worker a message
```

then `foo.worker.js`, The worker function lives inside of the module.exports:

```js
var gamma = require('gamma')

module.exports = function (self) {
  self.addEventListener('message',function (e) {
    var startNum = parseInt(e.data); // e.data=4 from main.js

    setInterval(function () {
      var r = startNum / Math.random() - 1
      self.postMessage([ startNum, r, gamma(r) ])
    }, 500)
  })
}
```
