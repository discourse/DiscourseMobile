/* @flow */
'use strict'

import _ from 'lodash'

import {
  Alert,
  AsyncStorage,
  Platform,
  PushNotificationIOS
} from 'react-native'

import Site from './site'
import RNKeyPair from 'react-native-key-pair'
import DeviceInfo from 'react-native-device-info'
import JSEncrypt from './../lib/jsencrypt'
import randomBytes from './../lib/random-bytes'
import BackgroundJob from './../lib/background-job'

class SiteManager {
  constructor() {
    this._subscribers = []
    this.sites = []
    this.load()

    this.firstFetch = new Date()
    this.lastFetch = new Date()
    this.fetchCount = 0

    AsyncStorage.getItem('@Discourse.lastRefresh').then(date => {
      if (date) {
        this.lastRefresh = new Date(date)
        this._onRefresh
      }
    })
  }

  refreshInterval(interval) {
    if (this._refresher) {
      clearInterval(this._refresher)
      this._refresher = null
    }

    this._refreshInterval = interval

    if (interval > 0) {
      this._refresher = setInterval(()=>{
        this.refreshSites({ui: false, fast: true})
      }, interval)
    }
  }

  exists(site) {
    return !!_.find(this.sites, {url: site.url})
  }

  add(site) {
    this.sites.push(site)
    this.save()
    this._onChange()
  }

  remove(site) {
    let index = this.sites.indexOf(site)
    if (index >= 0) {
      let site = this.sites.splice(index,1)[0]
      site.revokeApiKey()
          .catch(e => {
            console.log(`Failed to revoke API Key ${e}`)
          })
      this.save()
      this._onChange()
      this.updateUnreadBadge()
    }
  }

  updateOrder(from, to) {
    this.sites.splice(to, 0, this.sites.splice(from, 1)[0])
    this.save()
    this._onChange()
  }

  subscribe(callback) {
    this._subscribers.push(callback)
  }

  unsubscribe(callback) {
    var pos = this._subscribers.indexOf(callback)
    if (pos >= -1) {
      this._subscribers.splice(pos,1)
    }
  }

  updateUnreadBadge() {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.checkPermissions(p => {
        if (p.badge) {
          PushNotificationIOS.setApplicationIconBadgeNumber(this.totalUnread())
        }
      })
    }
  }

  save() {
    AsyncStorage.setItem('@Discourse.sites', JSON.stringify(this.sites)).done()
    this.updateUnreadBadge()
  }

  ensureRSAKeys() {
    return new Promise((resolve,reject)=> {
      if (this.rsaKeys) {
        resolve()
        return
      }

      AsyncStorage.getItem('@Discourse.rsaKeys').then((json) => {
        if (json) {
          this.rsaKeys = JSON.parse(json)
          resolve()
        } else {
          console.log('Generating RSA keys')
          RNKeyPair.generate((pair)=>{
            this.rsaKeys = pair
            console.log('Generated RSA keys')
            AsyncStorage.setItem('@Discourse.rsaKeys', JSON.stringify(this.rsaKeys))
            resolve()
          })
        }
      })
    })
  }

  isLoading() {
    return !!this._loading
  }

  load() {
    this._loading = true
    AsyncStorage.getItem('@Discourse.sites').then((json) => {
      if (json) {
        this.sites = JSON.parse(json).map(obj=>{
          let site = new Site(obj)
          // we require latest API
          site.ensureLatestApi()
          return site
        })
        this._loading = false
        this._onChange()
        this.refreshSites({ui: false, fast: true}).then(()=>{
          this._onChange()
        }).done()
      }
    })
    .finally(()=>{
      this._loading = false
      this._onChange()
    })
    .done()
  }

  totalUnread() {
    let count = 0
    this.sites.forEach((site)=>{
      if (site.authToken) {
        count += (site.unreadNotifications || 0) + (site.unreadPrivateMessages || 0)
        if (site.isStaff) {
          count += (site.flagCount || 0)
        }
      }
    })
    return count
  }

  waitFor(duration, check) {
    let start = new Date()

    return new Promise((resolve, reject)=>{
      let interval = setInterval(()=>{
        if (check()) {
          clearInterval(interval)
          resolve()
          return
        }
        if ((new Date() - start) > duration) {
          clearInterval(interval)
          reject()
          return
        }
      }, 10)
    })
  }

  enterBackground() {
    let enterBg = (id)=>{
      if (id) {
        BackgroundJob.finish(id)
      }
      this._background = true
      this.sites.forEach(s=>s.enterBackground())
    }

    if (this._refresher) {
      clearInterval(this._refresher)
      this._refresher = null
    }

    if (this.refreshing) {
      // let it finish
      BackgroundJob.start()
        .then(id=>{
          this.waitFor(20000, ()=>!this.refreshing)
              .finally(()=>{
                enterBg(id)
              })
        })
        .catch(()=>{
          // not implemented on android yet
          enterBg()
        })
    } else {
      BackgroundJob.start()
        .then(id=>{
          this.refreshSites({ui: false, background: true, forceRefresh: true})
            .finally(()=>enterBg(id))
        })
        .catch(()=>{
          // android fallback
          enterBg()
        })
    }

  }

  exitBackground() {
    this._background = false
    this.sites.forEach(s=>s.exitBackground())
    this.refreshInterval(this._refreshInterval)
    // in case UI did not pick up changes
    this._onChange()
    this._onRefresh()
  }

  refreshSites(opts) {

    if (opts.background) {
      this.lastFetch = new Date()
      this.fetchCount++
    }

    let sites = this.sites.slice(0)
    opts = opts || {}

    console.log('refresh sites was called on ' + sites.length + ' sites!')

    return new Promise((resolve,reject)=>{

      if (this._background && !opts.background) {
        console.log('skip refresh cause app is in background!')
        resolve({changed: false})
        return
      }

      if (sites.length === 0) {
        console.log('no sites defined nothing to refresh!')
        resolve({changed: false})
        return
      }

      let refreshDelta = this._lastRefreshStart && (new Date() - this._lastRefreshStart)

      if (!(opts.forceRefresh === true) &&
          (opts.ui === false) &&
          this._lastRefreshStart &&
          (refreshDelta < 10000)) {
        console.log('bg refresh skipped cause it ran in last 10 seconds!')
        resolve({changed: false})
        return
      }

      if (this.refreshing && refreshDelta < 60000) {
        console.log('not refreshing cause already refreshing!')
        resolve({changed: false})
        return
      }

      if (this.refreshing && refreshDelta >= 60000) {
        console.log('WARNING: a previous refresh went missing, resetting cause 1 minute is too long')
      }

      this.refreshing = true
      this._lastRefreshStart = new Date()

      let processedSites = 0
      let somethingChanged = false
      let alerts = []

      sites.forEach(site => {

        if (opts.ui) {
          site.resetBus()
        }

        if (opts.background) {
          site.exitBackground()
        }

        let errors = 0

        site.refresh(opts)
            .then((state) => {

              somethingChanged = somethingChanged || state.changed
              if (state.alerts) {
                alerts = alerts.concat(state.alerts)
              }
            })
            .catch((e)=>{
              console.log('failed to refresh ' + site.url)
              console.log(e)
              if (e === "User was logged off!") {
                somethingChanged = true
              }
              errors++
            })
            .finally(() => {

              if (this._background) {
                site.enterBackground()
              }

              processedSites++

              if (processedSites === sites.length) {

                // Don't save stuff in the background
                if (somethingChanged && !this._background) {
                  this.save()
                }

                if (somethingChanged && this._background) {
                  this.updateUnreadBadge()
                }

                if (somethingChanged) {
                  this._onChange()
                }


                if (errors < sites.length) {
                  this.lastRefresh = new Date()
                }

                if (!this._background && this.lastRefresh) {
                  AsyncStorage.setItem('@Discourse.lastRefresh', this.lastRefresh.toJSON()).done()
                }

                this._onRefresh()
                this.refreshing = false
                resolve({changed: somethingChanged, alerts: alerts})
              }
            })
            .done()

      })

    })
  }


  serializeParams(obj) {
    return Object.keys(obj)
                 .map(k => `${encodeURIComponent(k)}=${encodeURIComponent([obj[k]])}`)
                .join('&')
  }

  registerClientId(id) {

    console.log("REGISTER CLIENT ID " + id)

    this.getClientId().then(existing => {

      this.sites.forEach((site)=>{
        site.clientId = id
      })

      if (existing !== id) {
        this.clientId = id
        AsyncStorage.setItem('@ClientId', this.clientId)
        this.sites.forEach((site)=>{
          site.authToken = null
          site.userId = null
        })
        this.save()
      }
    })
  }


  getClientId() {
    return new Promise(resolve=>{
      if (this.clientId) {
        resolve(this.clientId)
      } else {
        AsyncStorage.getItem('@ClientId').then((clientId)=>{
          if (clientId && clientId.length > 0) {
            this.clientId = clientId
            resolve(clientId)
          } else {
            this.clientId = randomBytes(32)
            AsyncStorage.setItem('@ClientId', this.clientId)
            resolve(clientId)
          }
        })
      }
    })
  }

  generateNonce(site) {
    return new Promise(resolve=>{
      this._nonce = randomBytes(16)
      this._nonceSite = site
      resolve(this._nonce)
    })
  }

  handleAuthPayload(payload) {
    let crypt = new JSEncrypt()

    crypt.setKey(this.rsaKeys.private)
    let decrypted = JSON.parse(crypt.decrypt(payload))

    if (decrypted.nonce !== this._nonce) {
      Alert.alert('We were not expecting this reply, please try again!')
      return
    }

    this._nonceSite.authToken = decrypted.key
    this._nonceSite.hasPush = decrypted.push
    this._nonceSite.apiVersion = decrypted.api

    // cause we want to stop rendering connect
    this._onChange()

    this._nonceSite.refresh()
        .then(()=>{
          this._onChange()
        })
        .catch((e)=>{
          console.log('Failed to refresh ' + this._nonceSite.url  + ' ' + e)
        })
  }

  generateAuthURL(site) {
    let clientId

    return this.ensureRSAKeys().then(()=>
      this.getClientId()
      .then(cid => {
        clientId = cid
        return this.generateNonce(site)
      })
      .then(nonce => {
        let deviceName = 'Unknown Mobile Device'

        try {
          deviceName = DeviceInfo.getDeviceName()
        } catch (e) {
          // on android maybe this can fail?
        }

        let basePushUrl = 'https://api.discourse.org'
        //let basePushUrl = "http://l.discourse:3000"

        let params = {
          scopes: 'notifications,session_info',
          client_id: clientId,
          nonce: nonce,
          push_url: basePushUrl + '/api/publish_' + Platform.OS,
          auth_redirect: 'discourse://auth_redirect',
          application_name: 'Discourse - ' + deviceName,
          public_key: this.rsaKeys.public
        }

        return `${site.url}/user-api-key/new?${this.serializeParams(params)}`
      })
    )
  }

  getSeenNotificationMap() {
    return new Promise((resolve)=>{
      let promises = []
      let results = {}

      this.sites.forEach(site=>{
         if (site.authToken) {
           promises.push(
             site.getSeenNotificationId().then((id)=>
               results[site.url] = id
            )
           )
         }
      })

      Promise.all(promises)
             .then(()=>resolve(results))

    })
  }

  notifications(types, options) {

    return new Promise((resolve)=>{
      let promises = []
      this.sites.forEach(site=>{

         let opts = options

         if (opts.onlyNew) {
            opts = _.merge(_.clone(opts), {minId: opts.newMap[site.url]})
         }

         let promise = site.notifications(types, opts)
           .then(notifications=>{
              return notifications.map(n=>{return {notification: n, site: site}})
            })

         promises.push(promise)
      })

      let now = new Date()
      Promise.all(promises)
          .then((results) => {
             resolve(
               _.chain(results)
                  .flatten()
                  .orderBy([(o) => {
                    return (!o.notification.read && o.notification.notification_type === 6) ? 0: 1
                  }, 'notification.created_at'], ['asc', 'desc'])
                  .value()
              )
          }).done()
    })
  }

  toObject() {
    let object = {}
    this.sites.forEach((site)=>{object[site.url] = site})
    return object
  }

  _onRefresh() {
    this._subscribers.forEach((sub) => sub({event: 'refresh'}))
  }

  _onChange() {
    this._subscribers.forEach((sub) => sub({event: 'change'}))
  }
}

export default SiteManager
