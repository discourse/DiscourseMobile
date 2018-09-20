"use strict";

// https://github.com/apentle/react-native-cancelable-fetch
// (with very minor tweaks)

var _timeout = 10000;

function headers(xhr) {
  var head = new Headers();
  var pairs = xhr
    .getAllResponseHeaders()
    .trim()
    .split("\n");
  pairs.forEach(function(header) {
    var split = header.trim().split(":");
    var key = split.shift().trim();
    var value = split.join(":").trim();
    head.append(key, value);
  });
  return head;
}

// Fetch
module.exports = function(input, init) {
  var xhr = new XMLHttpRequest();

  let promise = new Promise(function(resolve, reject) {
    var request;
    if (Request.prototype.isPrototypeOf(input) && !init) {
      request = input;
    } else {
      request = new Request(input, init);
    }

    xhr.timeout = _timeout;

    function responseURL() {
      if ("responseURL" in xhr) {
        return xhr.responseURL;
      }

      // Avoid security warnings on getResponseHeader when not allowed by CORS
      if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
        return xhr.getResponseHeader("X-Request-URL");
      }

      return;
    }

    xhr.onload = function() {
      var status = xhr.status === 1223 ? 204 : xhr.status;
      if (status < 100 || status > 599) {
        console.log("XHR failed due to status: " + status);
        reject(new TypeError("Network request failed"));
        return;
      }

      var options = {
        status: status,
        statusText: xhr.statusText,
        headers: headers(xhr),
        url: responseURL()
      };
      var body = "response" in xhr ? xhr.response : xhr.responseText;
      promise.abort = null;
      resolve(new Response(body, options));
    };

    xhr.onerror = function() {
      reject(new TypeError("Network request failed"));
    };

    xhr.open(request.method, request.url, true);

    if (request.credentials === "include") {
      xhr.withCredentials = true;
    }

    /* istanbul ignore else  */
    if ("responseType" in xhr && typeof Request.prototype.blob === "function") {
      xhr.responseType = "blob";
    }

    request.headers.forEach(function(value, name) {
      xhr.setRequestHeader(name, value);
    });

    xhr.send(
      typeof request._bodyInit === "undefined" ? null : request._bodyInit
    );
  });

  promise.abort = () => {
    xhr.abort();
  };

  return promise;
};

module.exports.setTimeout = function(t) {
  _timeout = t;
};
