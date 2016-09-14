/* @flow */
'use strict'

import {
  AsyncStorage
} from 'react-native'

import _ from 'lodash'

class NotificationsStore {
  static LAST_REFRESH = '@Discourse.notificationsLastRefresh'
  static NOTIFICATIONS = '@Discourse.notifications'
  static REFRESH_THRESHOLD = 20000

  static shouldRefresh() {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem(this.LAST_REFRESH)
        .then(date => {
          console.log(date)
          if (date) {
            let lastRefresh = new Date(date)
            let refreshDelta = lastRefresh && (new Date() - lastRefresh)

            if (refreshDelta < this.REFRESH_THRESHOLD) {
              resolve(false)
            } else {
              resolve(true)
            }
          } else {
            resolve(true)
          }
        })
        .catch((error) => {
          console.log(error.stack)
        })
        .done()
    })
  }

  static markAsRead(notification) {
    this.getAll()
      .then((siteNotifications) => {
        let updatedObject = _.map(siteNotifications, function(siteNotification) {
          // TODO: check also on site ID, different notifications of different sites
          // could have the same ID
          if (siteNotification.notification.id === notification.id) {
            siteNotification.notification.read = true
          }
          return siteNotification
        })

        this.saveNotifications(updatedObject)
      })
      .catch((error) => {
        console.log(error.stack)
      })
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem(this.NOTIFICATIONS)
        .then((json) => {
          if (json) {
            resolve(JSON.parse(json).map(obj => obj))
          } else {
            resolve([])
          }
        })
        .catch((error) => {
          console.log(error.stack)
        })
        .done()
    })
  }

  static saveNotifications(notifications) {
    AsyncStorage.setItem(this.NOTIFICATIONS, JSON.stringify(notifications))
      .then(() => {
        let lastRefresh = new Date().toJSON()
        AsyncStorage.setItem(this.LAST_REFRESH, lastRefresh)
      })
      .catch((error) => {
        console.log(error.stack)
      })
      .done()
  }
}

export default NotificationsStore
