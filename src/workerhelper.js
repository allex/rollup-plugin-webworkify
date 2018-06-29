/**
 * Provide weworkify helpers
 *
 * @author Allex Wang (allex.wxn@gmail.com)
 * MIT Licensed
 */

const win = window,
  BlobBuilder = win.BlobBuilder || win.WebKitBlobBuilder || win.MozBlobBuilder || win.MSBlobBuilder,
  URL = win.URL || win.webkitURL || win.mozURL || win.msURL,
  SCRIPT_TYPE = 'application/javascript',
  TARGET = typeof Symbol === 'undefined' ? '__t' + +new Date() : Symbol() // eslint-disable-line symbol-description

let Worker = win.Worker // eslint-disable-line no-native-reassign

const nextTick = win.setImmediate || (f => setTimeout(f, 1))

/**
 * Returns a wrapper around Web Worker code that is constructible.
 *
 * @function shimWorker
 *
 * @param { String }    filename    The name of the file
 * @param { Function }  fn          Function wrapping the code of the worker
 */
export function workerCtor (filename, fn) {
  return function ShimWorker (forceFallback) {
    const o = this
    if (!(o instanceof ShimWorker)) {
      return new ShimWorker(forceFallback)
    }

    if (!fn) {
      return new Worker(filename)
    } else if (Worker && !forceFallback) {
      // Convert the function's inner code to a string to construct the worker
      // try to call default if defined to also support babel esmodule exports
      const source = `;(function(f){f&&new(f.default?f["default"]:f)(self)}((${fn.toString()})()))`

      const objURL = createSourceObject(source)
      const worker = new Worker(objURL)

      URL.revokeObjectURL(objURL)

      return (o[TARGET] = worker)
    } else {
      // Fallback worker implements
      const selfShim = new WorkerEmitter({
        close () {
          this.destroy()
        }
      }, o)

      Object.assign(new WorkerEmitter(o, selfShim), {
        isThisThread: true,
        // https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate
        terminate () {
          selfShim.close()
          this.destroy()
        }
      })

      // initialize ctor
      fn().call(selfShim, selfShim)
    }
  }
}

// A simple emitter impls for ShimWorker internal.
function WorkerEmitter (target, interObj) {
  let listeners = Object.create(null)
  target.onmessage = null
  target.addEventListener = function (type, fn) {
    const arr = (listeners[type] || (listeners[type] = []))
    if (!~arr.indexOf(fn)) {
      arr.push(fn)
    }
  }
  target.removeEventListener = function (type, fn) {
    let arr = listeners[type], index
    if (arr && (index = arr.indexOf(fn)) !== -1) {
      arr.splice(index, 1)
      if (!arr.length) delete listeners[type]
    }
  }
  target.postMessage = function (m) {
    nextTick(() => {
      const type = 'message'
      const data = m
      if (interObj.onmessage) {
        try {
          interObj.onmessage({ data, target })
        } catch (e) { console.error(e) }
      }
      interObj.emit(type, { type, data, target, timeStamp: +new Date() })
    })
  }
  target.emit = function (type, args) {
    const arr = listeners[type]
    if (arr) {
      arr.forEach((f, i) => f.call(target, args))
    }
  }
  target.destroy = function () {
    Object.keys(listeners).forEach(t => {
      const arr = listeners[t]
      if (arr) {
        arr.length = 0
        delete listeners[t]
      }
    })
    listeners = null
  }
  return target
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
