// vim: set ft=javascript fdm=marker et ff=unix tw=80 sw=2:

const path = require('path')
const babel = require('rollup-plugin-babel')

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

module.exports = {
  rollup: {
    destDir: path.join(__dirname, './lib'),
    entry: [
      {
        input: 'src/workerHelper.js',
        plugins: [
          babel,
          'resolve',
          'commonjs'
        ],
        targets: [
          {
            format: 'cjs',
            file: 'workerHelper.js',
            banner: banner(name + '/workerHelper.js', true)
          }
        ]
      },
      {
        input: 'src/index.js',
        plugins: [
          babel,
          'resolve',
          'commonjs'
        ],
        targets: [
          {
            format: 'cjs',
            file: 'index.js',
            banner: banner(name)
          }
        ]
      }
    ]
  }
}
