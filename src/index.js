
const STATE_OK = 'ok'
const STATE_BROKEN = 'broken'
const STATE_FAILED = 'failed'
const STATE_INVALID = 'invalid'
const STATE_FAILED_TIMEOUT = 'timeout_failed'
const IMG_EVENTS = ['load', 'abort', 'error']

const noop = () => { }

const isOptions = opts => (
  opts && typeof opts === 'object' &&
  (opts.hasOwnProperty('timeout') || opts.hasOwnProperty('onProgress'))
)

const isValid = (img) =>
  img && img.naturalHeight && img.naturalWidth

const isBroken = (img) =>
  img && img.complete && img.src && !(img.naturalHeight || img.naturalWidth)


const getState = (img, state) => {
  const result = { img }
  if (state instanceof Error) {
    result.error = state
    result.state = STATE_INVALID
  } else {
    result.state = state
  }
  return result
}


const registerHandlers = (img, resolve, reject, timeout) => {
  const timer = timeout && window.setTimeout(_ => {
    reject(getState(img, STATE_FAILED_TIMEOUT))
  }, timeout)

  const callback = (e) => {
    window.clearTimeout(timer)
    if (isValid(img)) {
      resolve(getState(img, STATE_OK))
    } else if (isBroken(img)) {
      reject(getState(img, STATE_BROKEN))
    } else {
      reject(getState(img, STATE_FAILED))
    }
    IMG_EVENTS.forEach(ev => {
      img.removeEventListener(ev, callback)
    })
  }
  IMG_EVENTS.forEach(ev => { img.addEventListener(ev, callback) })
}


const asyncImg = (imgsrc, { timeout = 0 }, total, img) => {
  if (!imgsrc) {
    return Promise.reject(getState(imgsrc, new Error('Image can not be empty')))
  }

  if (typeof imgsrc === 'string') {
    img = document.createElement('img')
    img.src = imgsrc
  } else if (imgsrc instanceof HTMLImageElement) {
    img = imgsrc //.cloneNode(true)
  } else {
    return Promise.reject(getState(imgsrc, new Error('Unsupported type')))
  }

  return new Promise((resolve, reject) => {
    if (isValid(img)) { return resolve(getState(img, STATE_OK)) }
    if (isBroken(img)) { return reject(getState(img, STATE_BROKEN)) }
    registerHandlers(img || imgsrc, resolve, reject, timeout)
  })
}


const imgsProcess = (imgs) => {
  return Promise.all(imgs)
    .then(processed => {
      const loaded = processed.filter(res => res.state === STATE_OK) //.map(res => res.img)
      const invalid = processed.filter(res => res.state !== STATE_OK)
      return loaded.length === processed.length
        ? loaded
        : Promise.reject({
          loaded,
          invalid,
        })
    })
}


const imgsLoaded = (options, ...args) => {
  if (!options && !args.length) {
    return Promise.reject({ error: new Error('Empty arguments') })
  }

  if (!isOptions(options)) {
    args.push(options)
    options = {}
  }

  const imgs = [].concat.apply([],
    args.map(arg => {
      if (arg && (
        arg instanceof HTMLCollection
        || arg instanceof NodeList
        || arg.jquery
      )) {
        if (arg.jquery) {
          return arg.get()
        }
        return Array.from(arg)
      }
      return arg
    })
  )

  let processedCounter = 0
  const onProgress = options.onProgress || noop
  const total = imgs.length
  onProgress(processedCounter, total, null)

  return imgsProcess(imgs.map(img =>
    asyncImg(img, options)
      .catch(e => e)
      .then(r => {
        onProgress(++processedCounter, total, r)
        return r
      })
  ), options)
}


export {
  imgsLoaded,
  imgsLoaded as default,
  STATE_OK,
  STATE_BROKEN,
  STATE_FAILED,
  STATE_FAILED_TIMEOUT,
  STATE_INVALID,
}