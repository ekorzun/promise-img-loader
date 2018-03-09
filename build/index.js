'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var STATE_OK = 'ok';
var STATE_BROKEN = 'broken';
var STATE_FAILED = 'failed';
var STATE_INVALID = 'invalid';
var STATE_FAILED_TIMEOUT = 'timeout_failed';
var IMG_EVENTS = ['load', 'abort', 'error'];

var noop = function noop() {};

var isOptions = function isOptions(opts) {
  return opts && (typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) === 'object' && (opts.hasOwnProperty('timeout') || opts.hasOwnProperty('onProgress'));
};

var isValid = function isValid(img) {
  return img && img.naturalHeight && img.naturalWidth;
};

var isBroken = function isBroken(img) {
  return img && img.complete && img.src && !(img.naturalHeight || img.naturalWidth);
};

var getState = function getState(img, state) {
  var result = { img: img };
  if (state instanceof Error) {
    result.error = state;
    result.state = STATE_INVALID;
  } else {
    result.state = state;
  }
  return result;
};

var registerHandlers = function registerHandlers(img, resolve, reject, timeout) {
  var timer = timeout && window.setTimeout(function (_) {
    reject(getState(img, STATE_FAILED_TIMEOUT));
  }, timeout);

  var callback = function callback(e) {
    window.clearTimeout(timer);
    if (isValid(img)) {
      resolve(getState(img, STATE_OK));
    } else if (isBroken(img)) {
      reject(getState(img, STATE_BROKEN));
    } else {
      reject(getState(img, STATE_FAILED));
    }
    IMG_EVENTS.forEach(function (ev) {
      img.removeEventListener(ev, callback);
    });
  };
  IMG_EVENTS.forEach(function (ev) {
    img.addEventListener(ev, callback);
  });
};

var asyncImg = function asyncImg(imgsrc, _ref, total, img) {
  var _ref$timeout = _ref.timeout,
      timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

  if (!imgsrc) {
    return Promise.reject(getState(imgsrc, new Error('Image can not be empty')));
  }

  if (typeof imgsrc === 'string') {
    img = document.createElement('img');
    img.src = imgsrc;
  } else if (imgsrc instanceof HTMLImageElement) {
    img = imgsrc; //.cloneNode(true)
  } else {
    return Promise.reject(getState(imgsrc, new Error('Unsupported type')));
  }

  return new Promise(function (resolve, reject) {
    if (isValid(img)) {
      return resolve(getState(img, STATE_OK));
    }
    if (isBroken(img)) {
      return reject(getState(img, STATE_BROKEN));
    }
    registerHandlers(img || imgsrc, resolve, reject, timeout);
  });
};

var imgsProcess = function imgsProcess(imgs) {
  return Promise.all(imgs).then(function (processed) {
    var loaded = processed.filter(function (res) {
      return res.state === STATE_OK;
    }); //.map(res => res.img)
    var invalid = processed.filter(function (res) {
      return res.state !== STATE_OK;
    });
    return loaded.length === processed.length ? loaded : Promise.reject({
      loaded: loaded,
      invalid: invalid
    });
  });
};

var imgsLoaded = function imgsLoaded(options) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (!options && !args.length) {
    return Promise.reject({ error: new Error('Empty arguments') });
  }

  if (!isOptions(options)) {
    args.push(options);
    options = {};
  }

  var imgs = [].concat.apply([], args.map(function (arg) {
    if (arg && (arg instanceof HTMLCollection || arg instanceof NodeList || arg.jquery)) {
      if (arg.jquery) {
        return arg.get();
      }
      return Array.from(arg);
    }
    return arg;
  }));

  var processedCounter = 0;
  var onProgress = options.onProgress || noop;
  var total = imgs.length;
  onProgress(processedCounter, total, null);

  return imgsProcess(imgs.map(function (img) {
    return asyncImg(img, options).catch(function (e) {
      return e;
    }).then(function (r) {
      onProgress(++processedCounter, total, r);
      return r;
    });
  }), options);
};

exports.imgsLoaded = imgsLoaded;
exports.default = imgsLoaded;
exports.STATE_OK = STATE_OK;
exports.STATE_BROKEN = STATE_BROKEN;
exports.STATE_FAILED = STATE_FAILED;
exports.STATE_FAILED_TIMEOUT = STATE_FAILED_TIMEOUT;
exports.STATE_INVALID = STATE_INVALID;
