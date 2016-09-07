/* @flow */
'use strict'

import React from 'react'

import {
  AppState,
  Linking,
  Platform,
  PushNotificationIOS
} from 'react-native'

import SiteManager from './site_manager'
import SafariView from 'react-native-safari-view'
import HomeScreen from './components/home/HomeScreen'
import BackgroundFetch from 'react-native-background-fetch'
import Browser from './components/Browser.js'

class Discourse extends React.Component {
  constructor(props) {
    super(props)
    this._siteManager = new SiteManager()
    this.state = {}

    this._handleOpenUrl = (event) => {
      console.log('handling incoming url')
      console.log(event)
      let split = event.url.split('payload=')
      if (split.length === 2) {
        this.closeBrowser()
        this._siteManager.handleAuthPayload(decodeURIComponent(split[1]))
      }
    }

    this._handleAppStateChange = () => {
      console.log('Detected appstate change ' + AppState.currentState)

      if (AppState.currentState === 'inactive') {
        this._siteManager.enterBackground()
      }

      if (AppState.currentState === 'active') {
        this._siteManager.exitBackground()
        this._siteManager.refreshSites({ui: false, fast: true})
      }
    }

    if (Platform.OS === 'ios') {

      SafariView.addEventListener('onShow', ()=>{
        this._siteManager.refreshInterval(60000)
      })

      SafariView.addEventListener('onDismiss', ()=>{
        this._siteManager.refreshInterval(15000)
        this._siteManager.refreshSites({ui: false, fast: true})
      })

      PushNotificationIOS.addEventListener('notification', (e) => this._handleRemoteNotification(e))
      PushNotificationIOS.addEventListener('localNotification', (e) => this._handleLocalNotification(e))

      PushNotificationIOS.addEventListener('register', (s)=>{
        this._siteManager.registerClientId(s)
      })

    }
  }

  _handleLocalNotification(e) {
    console.log('got local notification')
    console.log(e)
    if (AppState.currentState !== 'active' && e._data && e._data.discourse_url) {
      console.log('open safari view')
      SafariView.show({url: e._data.discourse_url})
    }
  }

  _handleRemoteNotification(e) {
    console.log('got remote notification')
    console.log(e)
    if (e._data && e._data.AppState === 'inactive' && e._data.discourse_url) {
      console.log('open safari view')
      SafariView.show({url: e._data.discourse_url})
    }

    // TODO if we are active we should try to notify user somehow that a notification
    // just landed .. tricky thing though is that safari view may be showing so we have
    // no way of presenting anything to the user in that case
  }

  componentDidMount() {
    Linking.addEventListener('url', this._handleOpenUrl)
    AppState.addEventListener('change', this._handleAppStateChange)

    if (Platform.OS === 'ios') {
      let doRefresh = () => {

        console.log('Background fetch Called!')

        this._siteManager.refreshSites({ui: false, fast: true, background: true})
          .then((state)=>{

            console.log('Finished refreshing sites in BG fetch!')
            console.log(state)

            if (state.alerts) {

              console.log('Got ' + state.alerts.length + ' alert in BG fetch')

              state.alerts.forEach((a) => {

                if (a.excerpt) {
                  let excerpt = a.username + ': '  + a.excerpt
                  excerpt = excerpt.substr(0,250)

                  if (!a.site.hasPush) {
                    console.log(`publishing local notifications for ${a.site.url}`)
                    PushNotificationIOS.presentLocalNotification({
                      alertBody: excerpt,
                      userInfo: {discourse_url: a.url}
                    })
                  }
                }
              })
            }
          })
        .catch((e) => {
          console.log('WARN: failed in bg fetch')
          console.log(e)
        })
        .finally(() => {
          PushNotificationIOS.checkPermissions(p => {
            if (p.badge) {
              let total = this._siteManager.totalUnread()
              console.log('Setting badge to ' + total)
              PushNotificationIOS.setApplicationIconBadgeNumber(total)
            }

            console.log('finishing up background fetch')
            BackgroundFetch.done(true)
          })
        })
      }



      BackgroundFetch.addEventListener('backgroundFetch', ()=>{

        if (this._siteManager.refreshing) {
          // assume prviously aborted and force allow a refresh
          console.log('WARNING: forcing refresh cause _siteManager was stuck refreshing')
          this._siteManager.refreshing = false
        }

        doRefresh()
      })
    }
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this._handleOpenUrl)
    AppState.addEventListener('change', this._handleAppStateChange)
  }

  openUrl(site) {
    if (site.authToken) {
      this.visitUrl(site.url)
      return
    }

    this._siteManager
      .generateAuthURL(site)
      .then(url => {
        this.visitUrl(url)
      })
  }

  visitUrl(url) {
    if (Platform.OS === 'ios') {
      SafariView.show({url})
    } else {
      this.setState({currentUrl: url})
    }
  }

  closeBrowser() {
    if (Platform.OS === 'ios') {
      SafariView.dismiss()
    } else {
      this.setState({currentUrl: null})
    }
  }

  render() {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.requestPermissions({'alert': true, 'badge': true})
    }

    if (this.state.currentUrl) {
      return (
          <Browser done={()=>{this.closeBrowser()}} url={this.state.currentUrl} />
      )
    } else {
      return (
        <HomeScreen
          siteManager={this._siteManager}
          onVisitSite={(site)=> this.openUrl(site)} />
      )
    }
  }
}

export default Discourse
