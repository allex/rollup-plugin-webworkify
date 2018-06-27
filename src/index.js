import { readFileSync } from 'fs'
import { resolve, dirname } from 'path' // eslint-disable-line no-unused-vars
import defaultResolver from './defaultResolver'
import { WORKER_PREFIX, HELPERS_ID, HELPERS_FILE } from './helpers'

function startsWith (str, prefix) {
  return str.slice(0, prefix.length) === prefix
}

export default (options = {}) => {
  const paths = new Map()
  return {
    name: 'webworkify',

    resolveId (importee, importer) {
      if (importee === HELPERS_ID) {
        return HELPERS_FILE
      } else if (startsWith(importee, WORKER_PREFIX)) {
        importee = importee.slice(WORKER_PREFIX.length)
        const target = defaultResolver(importee, importer)
        paths.set(target, importee)
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
      const code =
`
import * as webworkify from "${HELPERS_ID}"
export default webworkify.workerCtor(${JSON.stringify(paths.get(id))}, function () {
  var createWebworkifyModule = function (fn, module) {
    return module = { exports: {} }, fn(module, module.exports), module.exports
  }
  return createWebworkifyModule(function (module, exports) {
    ${readFileSync(id, 'utf8')}
  })
})
`
      return code
    }
  }
}
