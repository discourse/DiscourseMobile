'use strict'

import { NativeModules } from 'react-native'

const { RNBackgroundJob } = NativeModules;

class BackgroundJob {

  static start() {
    return new Promise((resolve,reject)=>{
      if (!RNBackgroundJob) {
        reject()
      } else {
        RNBackgroundJob.start((id)=>{
          console.log("bg id " + id)
          resolve(id)
        })
      }
    })
  }

  static finish(jobId) {
    if (RNBackgroundJob) {
      RNBackgroundJob.finish(jobId)
      console.log("finishing with id " + jobId)
    }
  }

}

export default BackgroundJob
