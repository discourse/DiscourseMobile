/* @flow */
'use strict'

class DiscourseApi {
  static getNotifications(site) {
    let params = {
      headers: DiscourseApi.buildHeaders(site.authToken)
    }

    return fetch(`${site.url}/notifications.json?recent=true&limit=25`, params)
      .then((response) => {
        return response.json()
      })
      .catch((error) => {
        console.log(error.stack)
      })
  }

  static buildHeaders(authToken) {
    return {
      'User-Api-Key': authToken,
      'User-Agent': 'Discourse IOS App / 1.0',
      'Content-Type': 'application/json',
      'Dont-Chunk': 'true'
    }
  }
}

export default DiscourseApi
