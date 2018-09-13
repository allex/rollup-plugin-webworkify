import { readFileSync } from 'fs'
import { resolve, dirname } from 'path' // eslint-disable-line no-unused-vars
import defaultResolver from './defaultResolver'
import { WORKER_PREFIX, HELPERS_ID, HELPERS_FILE } from './helpers'
import { createFilter } from 'rollup-pluginutils'

const startsWith = (str, prefix) => str.slice(0, prefix.length) === prefix

export default (options = {}) => {
  const paths = new Map()
  const { pattern } = options

  const filter = (pattern && pattern.length)
    ? createFilter(pattern)
    : v => false

  const resolveWorkerImportee = (id, importer) => {
    if (startsWith(id, WORKER_PREFIX)) {
      return defaultResolver(id.slice(WORKER_PREFIX.length), importer)
    } else if (filter(id = defaultResolver(id, importer))) {
      return id
    }
  }

  return {
    name: 'webworkify',

    resolveId (importee, importer) {
      let target
      if (importee === HELPERS_ID) {
        return HELPERS_FILE
      } else if (target = resolveWorkerImportee(importee, importer)) {
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
import * as webworkify from '${HELPERS_ID}'
export default webworkify.workerCtor('${paths.get(id)}', function() { return (function(e,r){return e(r={exports:{}},r.exports),r.exports})(function (module, exports) {
  ${readFileSync(id, 'utf8')}
});})
`
      return code
    }
  }
}
