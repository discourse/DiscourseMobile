"use strict";

var randomBytes = function(length) {
  return Array(length + 1)
    .join("x")
    .replace(/x/g, c => {
      return Math.floor(Math.random() * 16).toString(16);
    });
};

// random is only used for nonce, message bus id and fallback clientId
// in all cases the poor entropy JS random should suffice
export default randomBytes;
