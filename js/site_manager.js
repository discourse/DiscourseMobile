/* @flow */
'use strict'

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
    }
  }

  subscribe(callback) {
    this._subscribers.push(callback)
  }

  unsubscribe(callback) {
    var pos = this._subscribers.indexOf(callback)
    if (pos >= -1) {
      this._subscribers = this._subscribers.splice(pos,1)
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
            resolve()
            console.log('Generated RSA keys')
            AsyncStorage.setItem('@Discourse.rsaKeys', JSON.stringify(this.rsaKeys))
          })
        }
      })
    })
  }

  load() {
    AsyncStorage.getItem('@Discourse.sites').then((json) => {
      if (json) {
        this.sites = JSON.parse(json).map(obj=>new Site(obj))
        this._onChange()
        this.refreshSites({ui: false, fast: true}).then(()=>{
          this._onChange()
        }).done()
      }
    }).done()
  }

  totalUnread() {
    let count = 0
    this.sites.forEach((site)=>{
      if (site.authToken) {
        count += (site.unreadNotifications || 0) + (site.unreadPrivateMessages || 0)
      }
    })
    return count
  }

  enterBackground() {
    if (this._refresher) {
      clearInterval(this._refresher)
      this._refresher = null
    }
    this._background = true
    this.sites.forEach(s=>s.enterBackground())

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

      if (opts.ui === false && this._lastRefreshStart && refreshDelta < 10000) {
        console.log('bg refresh skipped cause it is already running!')
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
              // maybe we were logged out ... something is odd
              somethingChanged = true
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
                } else if (somethingChanged) {
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
    this.getClientId().then(existing => {
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
    this._nonceSite.hasPush = decrypted.access.indexOf('p') > -1

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

        let params = {
          access: 'rp',
          client_id: clientId,
          nonce: nonce,
          push_url: 'https://api.discourse.org/api/publish_ios',
          auth_redirect: 'discourse://auth_redirect',
          application_name: 'Discourse - ' + deviceName,
          public_key: this.rsaKeys.public
        }

        return `${site.url}/user-api-key/new?${this.serializeParams(params)}`
      })
    )
  }

  _onRefresh() {
    this._subscribers.forEach((sub) => sub({event: 'refresh'}))
  }

  _onChange() {
    this._subscribers.forEach((sub) => sub({event: 'change'}))
  }
}

export default SiteManager
