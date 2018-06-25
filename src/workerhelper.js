/**
 * Provide worker helpers for rollup generations
 *
 * @author Allex Wang (allex.wxn@gmail.com)
 * MIT Licensed
 */

const TARGET = typeof Symbol === 'undefined' ? '__target' : Symbol(), // eslint-disable-line symbol-description
  SCRIPT_TYPE = 'application/javascript',
  win = window,
  BlobBuilder = win.BlobBuilder || win.WebKitBlobBuilder || win.MozBlobBuilder || win.MSBlobBuilder,
  URL = win.URL || win.webkitURL || win.mozURL || win.msURL

let Worker = win.Worker // eslint-disable-line no-native-reassign

/**
 * Returns a wrapper around Web Worker code that is constructible.
 *
 * @function shimWorker
 *
 * @param { String }    filename    The name of the file
 * @param { Function }  fn          Function wrapping the code of the worker
 */
export default function shimWorker (filename, fn) {
  return function ShimWorker (forceFallback) {
    const o = this
    if (!(o instanceof ShimWorker)) {
      return new ShimWorker(forceFallback)
    }

    if (!fn) {
      return new Worker(filename)
    } else if (Worker && !forceFallback) {
      // Convert the function's inner code to a string to construct the worker
      const source =
        ';(function(require,module,exports,f){' +
          'exports = module.exports = {};' +
          `(${fn.toString()})();` +
          // try to call default if defined to also support babel esmodule exports
          'f = module.exports;' +
          'f && new (f.default ? f.default : f)(self);' +
        '}(0,{}))'

      const objURL = createSourceObject(source)

      this[TARGET] = new Worker(objURL)
      URL.revokeObjectURL(objURL)

      return this[TARGET]
    } else {
      const selfShim = {
        postMessage (m) {
          if (o.onmessage) {
            setTimeout(() => o.onmessage({ data: m, target: selfShim }))
          }
        }
      }
      fn.call(selfShim, selfShim)
      this.postMessage = function (m) {
        setTimeout(() => selfShim.onmessage({ data: m, target: o }))
      }
      this.isThisThread = true
    }
  }
}

// Test Worker capabilities
if (Worker) {
  let testWorker,
    objURL = createSourceObject('self.onmessage = function () {}'),
    testArray = new Uint8Array(1)

  try {
    // No workers via blobs in Edge 12 and IE 11 and lower :(
    if (/(?:Trident|Edge)\/(?:[567]|12)/i.test(navigator.userAgent)) {
      throw new Error('Not available')
    }
    testWorker = new Worker(objURL)

    // Native browser on some Samsung devices throws for transferables, let's detect it
    testWorker.postMessage(testArray, [testArray.buffer])
  } catch (e) {
    Worker = null
  } finally {
    URL.revokeObjectURL(objURL)
    if (testWorker) {
      testWorker.terminate()
    }
  }
}

function createSourceObject (str) {
  const type = SCRIPT_TYPE
  try {
    return URL.createObjectURL(new Blob([str], { type }))
  } catch (e) {
    let blob = new BlobBuilder()
    blob.append(str)
    return URL.createObjectURL(blob.getBlob(type))
  }
}
