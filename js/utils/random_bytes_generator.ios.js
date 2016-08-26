/* @flow */
'use strict'

import randomBytes from 'react-native-randombytes';

class RandomBytesGenerator {
  static generateHex(count) {
    return new Promise(resolve=>{
      randomBytes(count, (err, bytes) => {
        resolve(bytes.toString('hex'));
      });
    })
  }
}

export default RandomBytesGenerator;
