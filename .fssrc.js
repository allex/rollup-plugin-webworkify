// vim: set ft=javascript fdm=marker et ff=unix tw=80 sw=2:

import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'

const path = require('path')
const { version, name, author, license, dependencies } = require('./package.json')

const banner = (name, short = false) => {
  let s;
  if (short) {
    s = `/*! ${name} v${version} | ${license} Licensed | ${author} */`
  } else {
    s = `/*!
 * ${name} v${version}
 *
 * @author ${author}
 * Released under the ${license} License.
 */`
  }
  return s
}

export default {
  destDir: path.join(__dirname, './lib'),
  dependencies: Object.keys(dependencies).concat([ 'fs', 'path', 'events', 'module', 'util' ]),
  pluginOptions: {
    terser () {
      return {
        compress: true, mangle: true,
        output: {
          beautify: true, indent_level: 2,
          comments (n, c) { var text = c.value, type = c.type; if (type === 'comment2') return /^!|@preserve|@license|@cc_on| Licensed/i.test(text) }
        }
      }
    }
  },
  entry: [
    {
      input: 'src/workerhelper.js',
      plugins: [ babel, 'resolve', 'commonjs', terser ],
      targets: [
        { format: 'es', file: 'workerhelper.js', banner: banner(name + '/workerhelper.js', true) }
      ]
    },
    {
      input: 'src/index.js',
      plugins: [ babel, 'resolve', 'commonjs' ],
      targets: [
        { format: 'cjs', file: 'index.js', banner: banner(name) }
      ]
    }
  ]
}
