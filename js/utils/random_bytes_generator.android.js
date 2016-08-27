/* @flow */
'use strict'

if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer
}

import sjcl from 'sjcl'

class RandomBytesGenerator {
  static generateHex(size) {
    return new Promise(resolve=>{
      let RNRandomBytes = require('react-native').NativeModules.RNRandomBytes

      // add entropy
      let seedBuffer = new global.Buffer(RNRandomBytes.seed, 'base64')
      let hexStringFromSeed = seedBuffer.toString('hex')
      let stanfordSeed = sjcl.codec.hex.toBits(hexStringFromSeed)
      sjcl.random.addEntropy(stanfordSeed)

      // random bytes generation
      let wordCount = Math.ceil(size * 0.25)
      let randomBytes = sjcl.random.randomWords(wordCount, 10)
      let hexString = sjcl.codec.hex.fromBits(randomBytes)
      resolve(hexString.substr(0, size * 2))
    })
  }
}

export default RandomBytesGenerator
