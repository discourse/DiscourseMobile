/* @flow */
'use strict'

import randomBytes from 'react-native-randombytes'

class RandomBytesGenerator {
  static generateHex(size) {
    return new Promise(resolve=>{
      randomBytes(size, (_, bytes) => {
        resolve(bytes.toString('hex'))
      })
    })
  }
}

export default RandomBytesGenerator
