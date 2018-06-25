const fs = require('fs'),
  path = require('path'),
  paths = new Map()

export default () => {
  return {
    name: 'webworkify',

    resolveId (importee, importer) {
      if (importee === 'rollup-plugin-webworkify') {
        return path.resolve(__dirname, 'workerhelper.js')
      } else if (importee.indexOf('worker#') === 0) {
        const name = importee.split('#')[1],
          target = path.resolve(path.dirname(importer), name)
        paths.set(target, name)
        return target
      }
    },

    /**
     * Do everything in load so that code loaded by the plugin can still be transformed by the
     * rollup configuration
     */
    load (id) {
      if (!paths.has(id)) {
        return
      }
      // wrapper as a commonjs module
      const code = `
var shimWorker = require('rollup-plugin-webworkify')
module.exports = new shimWorker(${JSON.stringify(paths.get(id))}, function () {
  ${fs.readFileSync(id, 'utf-8')}
})`
      return code
    }
  }
}
