const { NativeEventEmitter } = require("react-native");
const { RNBackgroundFetch } = require("react-native").NativeModules;

if (RNBackgroundFetch) {
  class Api extends NativeEventEmitter {
    constructor() {
      super(RNBackgroundFetch);
    }

    addEventListener(type, handler) {
      this.addListener(type, handler);
    }

    done(result) {
      RNBackgroundFetch.done(result);
    }

    getCount(callback) {
      RNBackgroundFetch.getCount(callback);
    }
  }

  module.exports = new Api();
} else {
  // android
}
