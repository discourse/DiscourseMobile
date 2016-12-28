/* @flow */
'use strict'

import { Platform } from 'react-native'
import _ from 'lodash'

const fetch = require('./../lib/fetch')
import randomBytes from './../lib/random-bytes'

class Site {
  static FIELDS = [
    'authToken',
    'title',
    'description',
    'icon',
    'url',
    'unreadNotifications',
    'unreadPrivateMessages',
    'lastSeenNotificationId',
    'flagCount',
    'queueCount',
    'totalUnread',
    'totalNew',
    'userId',
    'username',
    'hasPush',
    'isStaff',
    'apiVersion'
  ]

  static fromTerm(term) {
    let url = ''

    term = term.trim()
    while (term.endsWith('/')) {
      term = term.slice(0, term.length - 1)
    }

    if (!term.match(/^https?:\/\//)){
      url = `http://${term}`
    } else {
      url = term
    }

    return Site.fromURL(url, term)
  }

  static fromURL(url, term) {
    let req = new Request(`${url}/user-api-key/new`, {
      method: 'HEAD'
    })

    return fetch(req)
      .then((userApiKeyResponse)=>{
        if (userApiKeyResponse.status === 404) {
          throw 'bad api'
          return
        }

        if (userApiKeyResponse.status !== 200) {
          throw 'bad url'
          return
        }

        let version = userApiKeyResponse.headers.get('Auth-Api-Version')
        if (parseInt(version,10) < 2) {
          throw 'bad api'
          return
        }

        // correct url in case we had a redirect
        let split = userApiKeyResponse.url.split('/')
        url = split[0] + '//' + split[2]

        return fetch(`${url}/site/basic-info.json`)
          .then(basicInfoResponse => basicInfoResponse.json())
      })
      .then(info=>{
        return new Site({
          url: url,
          title: info.title,
          description: info.description,
          icon: info.apple_touch_icon_url
        })
      })
  }


  constructor(props) {
    if (props) {
      Site.FIELDS.forEach(prop=>{this[prop] = props[prop]})
    }
    this._timeout = 10000
  }

  jsonApi(path, method, data) {
    console.log(`calling: ${this.url}${path}`)

    method = method || 'GET'
    let headers = {
      'User-Api-Key': this.authToken,
      'User-Agent': `Discourse ${Platform.OS} App / 1.0`,
      'Content-Type': 'application/json',
      'Dont-Chunk': 'true',
      'User-Api-Client-Id': (this.clientId || '')
    }

    if (data) {
      data = JSON.stringify(data)
    }

    if (this._background) {
      return new Promise((resolve, reject) => reject('In background mode aborting start request!'))
    }

    return new Promise((resolve, reject) => {

      let req = new Request(this.url + path, {
        headers: headers,
        method: method,
        body: data
      })
      this._currentFetch = fetch(req)
      this._currentFetch.then(r1 => {
        if (this._background) {
          throw 'In Background mode aborting request!'
        }
        if (r1.status === 200) {
          return r1.json()
        } else {
          if (r1.status === 403) {
            this.logoff()
            throw 'User was logged off!'
          } else {
            throw 'Error during fetch status code:' + r1.status
          }
        }
      })
      .then(result=>{
        resolve(result)
      })
      .catch((e)=>{
        reject(e)
      })
      .finally(()=>{
        this._currentFetch = undefined
      })
      .done()
    })
  }

  logoff() {
    this.authToken = null
    this.userId = null
    this.username = null
    this.isStaff = null
  }

  ensureLatestApi() {
    if (this.apiVersion < 2) {
      this.logoff()
    }
  }

  revokeApiKey() {
    return this.jsonApi('/user-api-key/revoke', 'POST')
  }

  getUserInfo() {
    return new Promise((resolve, reject) => {
      if (this.userId && this.username) {
        console.log('we have user id and user name')
        resolve({userId: this.userId, username: this.username, isStaff: this.isStaff})
      } else {
        this.jsonApi('/session/current.json')
          .then(json =>{

            this.userId = json.current_user.id
            this.username = json.current_user.username
            this.isStaff = !!(json.current_user.admin || json.current_user.moderator)

            resolve({
              userId: this.userId,
              username: this.username,
              isStaff: this.isStaff
            })
          })
          .catch(err => {
            reject(err)
          }).done()
      }
    })
  }

  getMessageBusId() {
    return new Promise(resolve => {
      if (this.messageBusId) {
        resolve(this.messageBusId)
      } else {
        this.messageBusId = randomBytes(16)
        resolve(this.messageBusId)
      }
    })
  }

  messageBus(channels){
    return this.getMessageBusId()
      .then(messageBusId => {
        return this.jsonApi(`/message-bus/${messageBusId}/poll?dlp=t`, 'POST', channels)
      })
  }

  processMessages(messages) {
    let rval = {
      notifications: false,
      totals: false,
      alerts: []
    }

    let notificationChannel = `/notification/${this.userId}`
    let alertChannel = `/notification-alert/${this.userId}`

    messages.forEach(message => {

      console.info(`processing incoming message on ${this.url}`)
      console.log(message)

      if (this.channels) {
        this.channels[message.channel] = message.message_id
      }

      if (message.channel === '/__status') {
        this.channels = message.data
        this.channels.__seq = 0
        // we have to get notifications now cause we may have an incorrect number
        rval.notifications = true
      } else if (message.channel === notificationChannel) {

        this._seenNotificationId = message.data.seen_notification_id

        // force a refresh on next open
        if (this._notifications) {
          // compare most recent notifications
          let newData = message.data.recent

          let existing = _.chain(this._notifications)
                          .take(newData.length)
                          .map(n=>[n.id, n.read])
                          .value()

          let changed = !_.isEqual(newData,existing)
          if (changed) {
            this._notifications = null
            rval.notifications = true
          }
        }

        if (this.unreadNotifications !== message.data.unread_notifications) {
          this.unreadNotifications = message.data.unread_notifications
          rval.notifications = true
        }

        if (this.unreadPrivateMessages !== message.data.unread_private_messages) {
          this.unreadPrivateMessages = message.data.unread_private_messages
          rval.notifications = true
        }

      } else if (['/new', '/latest', '/unread/' + this.userId].indexOf(message.channel) > -1) {
        let payload = message.data.payload
        if (payload.archetype !== 'private_message') {
          let existing = this.trackingState['t' + payload.topic_id]
          if (existing) {
            this.trackingState['t' + payload.topic_id] = _.merge(existing, payload)
          } else {
            this.trackingState['t' + payload.topic_id] = payload
          }
          this.updateTotals()
          rval.totals = true
        }
      } else if (message.channel === '/recover' || message.channel === '/delete') {
        let existing = this.trackingState['t' + message.data.payload.topic_id]
        if (existing) {
          existing.deleted = (message.channel === '/delete')
        }
      } else if (message.channel === '/flagged_counts') {
        if (this.flagCount !== message.data.total) {
          this.flagCount = message.data.total
          rval.notifications = true
        }
      } else if (message.channel === '/queue_counts') {
        if (this.queueCount !== message.data.post_queue_new_count) {
          // yes this is weird, we have some real coupled code here
          this.flagCount -= ((this.queueCount || 0) - message.data.post_queue_new_count)
          this.queueCount = message.data.post_queue_new_count
          rval.notifications = true
        }
      } else if (message.channel === alertChannel) {
        message.data.url = this.url + message.data.post_url
        message.data.site = this
        rval.alerts.push(message.data)
      }
    })

    return rval
  }

  resetBus() {
    this.userId = null
    this.username = null
    this.isStaff = null
    this.trackingState = null
    this.channels = null
  }

  initBus(){
    return new Promise((resolve,reject) => {
      if (this.channels && this.trackingState) {
        resolve({wasReady: true})
      } else {

        this.getUserInfo()
            .then(info => {

          let channels = {
            '/delete': -1,
            '/recover': -1,
            '/new': -1,
            '/latest': -1,
            '__seq': 1
          }

          if (info.isStaff) {
            channels['/queue_counts'] = -1
            channels['/flagged_counts'] = -1
          }

          channels[`/notification/${info.userId}`] = -1
          channels[`/notification-alert/${info.userId}`] = -1
          channels[`/unread/${info.userId}`] = -1

          this.messageBus(channels).then(r => {
            this.processMessages(r)

            this.jsonApi(`/users/${info.username}/topic-tracking-state.json`)
              .then(trackingState => {
                this.trackingState = {}
                trackingState.forEach(state => {
                  this.trackingState[`t${state.topic_id}`] = state
                })
                resolve({wasReady: false})
              })
              .catch(e => {
                console.log('failed to get tracking state ' + e)
                reject(e)
              }).done()
          })
          .catch(e => {
            console.log(`failed to poll message bus ${e}`)
            reject(e)
          }).done()

        })
        .catch(e => {
          console.log(`get user info failed ${e}`)
          reject(e)
        }).done()
      }
    })
  }

  isNew(topic) {
    return topic.last_read_post_number === null &&
          ((topic.notification_level !== 0 && !topic.notification_level) ||
          topic.notification_level >= 2)
  }

  isUnread(topic) {
    return topic.last_read_post_number !== null &&
           topic.last_read_post_number < topic.highest_post_number &&
           topic.notification_level >= 2
  }

  updateTotals() {
    let unread = 0
    let newTopics = 0

    _.each(this.trackingState, t => {

      if (!t.deleted && t.archetype !== 'private_message') {
        if (this.isNew(t)) {
          newTopics++
        } else if (this.isUnread(t)) {
          unread++
        }
      }
    })

    let changed = this.totalUnread !== unread || this.totalNew !== newTopics

    this.totalUnread = unread
    this.totalNew = newTopics

    return changed
  }

  checkBus() {
    console.info(`${new Date()} Checking Message Bus on ${this.url}`)
    return this.messageBus(this.channels).then(messages => this.processMessages(messages))
  }

  refresh(opts){

    opts = opts || {}

    return new Promise((resolve,reject) => {

      if (!this.authToken) {
        resolve({changed: false})
        return
      }

      this.initBus().then((busState) => {

        if (opts.fast || !busState.wasReady) {
          this.checkBus()
              .then(changes => {
                 console.log(`changes detected on ${this.url}`)
                 console.log(changes)

                 if (!busState.wasReady) {
                   this.updateTotals()

                   this.refresh({fast: false})
                       .then(result => {
                         resolve({changed: true, alerts: changes.alerts})
                       })
                       .catch(e => reject(e))
                       .done()

                 } else {
                   resolve({changed: this.updateTotals() || changes.notifications || changes.totals, alerts: changes.alerts})
                 }
              })
              .catch(e => {
                console.log(`failed to check bus ${e}`)
                reject(e)
              })

          return
        }

        this.jsonApi('/session/current.json')
           .then(json =>{
             let currentUser = json.current_user

             let changed = (this.userId !== currentUser.id) ||
                           (this.username !== currentUser.username) ||
                           (this.isStaff !== !!(currentUser.admin || currentUser.moderator))

             changed = changed || this.updateTotals()

             this.userId = currentUser.id
             this.username = currentUser.username
             this.isStaff = !!(currentUser.admin || currentUser.moderator)

             // in case of old API fallback
             this._seenNotificationId = currentUser.seen_notification_id || this._seenNotificationId

             if (this.unreadNotifications !== currentUser.unread_notifications) {
               this.unreadNotifications = currentUser.unread_notifications
               changed = true
             }

             if (this.unreadPrivateMessages !== currentUser.unread_private_messages) {
               this.unreadPrivateMessages = currentUser.unread_private_messages
               changed = true
             }

             if (this.isStaff) {

               let newFlagCount = currentUser.post_queue_new_count
               if (newFlagCount !== this.flagCount) {
                  this.flagCount = newFlagCount
                  changed = true
               }

               let newQueueCount = currentUser.post_queue_new_count
               if (newQueueCount !== this.queueCount) {
                  this.queueCount = newQueueCount
                  changed = true
               }
             }

             resolve({changed})

            })
            .catch(e=>{
              console.warn(e)
              reject(e)
           })
      })
      .catch(e => {
        reject(e)
      })
    })
  }

  enterBackground() {
    this._background = true
    if (this._currentFetch && this._currentFetch.abort) {
      this._currentFetch.abort()
    }
    this._timeout = 5000
  }

  exitBackground() {
    this._background = false
    this._timeout = 10000
  }

  readNotification(notification) {
    return new Promise((resolve,reject)=>{
      this.jsonApi('/notifications/read', 'PUT', {id: notification.id})
        .catch(e=>{
          reject(e)
        })
        .finally(()=>resolve)
        .done()
    })
  }

  getSeenNotificationId() {
    return new Promise(resolve=>{
      if (!this.authToken) {
        resolve()
        return
      }

      if(this._seenNotificationId) {
        resolve(this._seenNotificationId)
        return
      }

      this.notifications().then(()=>{
        resolve(this._seenNotificationId)
      })
    })
  }


  notifications(types, options) {

    if (this._loadingNotifications) {

      // avoid double json
      return new Promise(resolve => {
        let retries = 100
        let interval = setInterval(()=>{
          retries--
          if (retries === 0 || this._notifications) {
            clearInterval(interval)
            this.notifications(types).then((n)=>{resolve(n)}).done()
          }
        },50)
      })
    }

    return new Promise(resolve => {
      if (!this.authToken) {
        resolve([])
        return
      }

      let silent = !(options && options.silent === false)
      // avoid json call when no unread
      silent = silent || this.unreadNotifications === 0

      if (this._notifications && silent) {
        let filtered = this._notifications
        let minId = options && options.minId
        if (types || minId) {
          filtered = _.filter(filtered, notification=>{
            // for new always show unread PMs and suppress read
            if (minId) {
              if (notification.read) { return false }
              if (!notification.read && notification.notification_type === 6) { return true }
            }
            if (minId && minId >= notification.id) {
              return false
            }
            return !types || _.includes(types, notification.notification_type)
          })
        }
        resolve(filtered)
        return
      }

      this._loadingNotifications = true
      this.jsonApi('/notifications.json?recent=true&limit=25' + (options && options.silent===false ? "" : "&silent=true"))
          .then(results=>{
            this._loadingNotifications = false
            this._notifications = (results && results.notifications) || []
            this._seenNotificationId = results && results.seen_notification_id
            this.notifications(types, _.merge(options, {silent: true}))
                .then(n=>
                    resolve(n)
                ).done()
          })
          .catch(e=>{
            console.log("failed to fetch notifications " + e)
            resolve([])
          })
          .finally(()=>{this._loadingNotifications = false})
          .done()
    })
  }

  toJSON() {
    let obj = {}
    Site.FIELDS.forEach(prop=>{obj[prop] = this[prop]})
    return obj
  }
}

export default Site
