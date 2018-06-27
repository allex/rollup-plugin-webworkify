import { resolve } from 'path'
export const HELPERS_ID = '\0webworkifyHelpers'

export const HELPERS = `
export var webworkifyGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

export function webworkifyRequire () {
  throw new Error('Dynamic requires are not currently supported by rollup-plugin-webworkify');
}

export function unwrapExports (x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

export function createCommonjsModule(fn, module) {
  return module = { exports: {} }, fn(module, module.exports), module.exports;
}`

export const PREFIX = '\0webworkify-proxy:'
export const EXTERNAL = '\0webworkify-external:'
export const WORKER_PREFIX = 'worker#'
export const HELPERS_FILE = resolve(__dirname, './workerhelper.js')
