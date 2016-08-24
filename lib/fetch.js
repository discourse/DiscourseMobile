// https://github.com/apentle/react-native-cancelable-fetch
// (with very minor tweaks)

'use strict';

var _xhrs = []

function remove(xhr) {
  if (xhr.tag !== undefined) {
    var i = _xhrs.indexOf(xhr)
    /* istanbul ignore else  */
    if (i !== -1) {
      _xhrs.splice(i, 1)
    }
  }
}

function headers(xhr) {
  var head = new Headers()
  var pairs = xhr.getAllResponseHeaders().trim().split('\n')
  pairs.forEach(function(header) {
    var split = header.trim().split(':')
    var key = split.shift().trim()
    var value = split.join(':').trim()
    head.append(key, value)
  })
  return head
}

// Fetch
module.exports = function(input, init, tag) {
  return new Promise(function(resolve, reject) {
    var request
    if (Request.prototype.isPrototypeOf(input) && !init) {
      request = input
    } else {
      request = new Request(input, init)
    }

    var xhr = new XMLHttpRequest()

    if (tag !== undefined) {
      xhr.tag = tag
      _xhrs.push(xhr)
    }

    function responseURL() {
      if ('responseURL' in xhr) {
        return xhr.responseURL
      }

      // Avoid security warnings on getResponseHeader when not allowed by CORS
      if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
        return xhr.getResponseHeader('X-Request-URL')
      }

      return;
    }

    xhr.onload = function() {
      var status = (xhr.status === 1223) ? 204 : xhr.status
      if (status < 100 || status > 599) {
        remove(xhr)
        reject(new TypeError('Network request failed'))
        return
      }

      var options = {
        status: status,
        statusText: xhr.statusText,
        headers: headers(xhr),
        url: responseURL()
      }
      var body = 'response' in xhr ? xhr.response : xhr.responseText;
      remove(xhr)
      resolve(new Response(body, options))
    }

    xhr.onerror = function() {
      remove(xhr)
      reject(new TypeError('Network request failed'))
    }

    xhr.open(request.method, request.url, true)

    if (request.credentials === 'include') {
      xhr.withCredentials = true
    }

    /* istanbul ignore else  */
    if ('responseType' in xhr && typeof Request.prototype.blob === 'function') {
      xhr.responseType = 'blob'
    }

    request.headers.forEach(function(value, name) {
      xhr.setRequestHeader(name, value)
    })

    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
  })
}

module.exports.abort = function(tag) {
  for (var i = _xhrs.length - 1; i > -1; i--) {
    var xhr = _xhrs[i]
    if (xhr.tag === tag) {
      _xhrs.splice(i, 1)
      xhr.abort()
    }
  }
}
