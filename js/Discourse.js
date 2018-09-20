/* @flow */
'use strict'

import React from 'react'

import {
  Alert,
  AppState,
  Linking,
  NativeModules,
  Platform,
  PushNotificationIOS,
  StyleSheet
} from 'react-native'

import { StackNavigator, NavigationActions } from 'react-navigation'

import Screens from './screens'
import SiteManager from './site_manager'
import DiscourseSafariViewManager from '../lib/discourse-safari-view-manager'

const ChromeCustomTab = NativeModules.ChromeCustomTab

const AppNavigator = StackNavigator(
  {
    Home: { screen: Screens.Home },
    Notifications: { screen: Screens.Notifications }
  },
  {
    mode: 'modal',
    headerMode: 'none'
  }
)

class Discourse extends React.Component {
  constructor(props) {
    super(props)
    this._siteManager = new SiteManager()

    if (this.props.url) {
      this.openUrl(this.props.url)
    }

    this._handleAppStateChange = () => {
      console.log('Detected appstate change ' + AppState.currentState)

      if (AppState.currentState === 'inactive') {
        this._siteManager.enterBackground()
        this._seenNotificationMap = null
        this.resetToTop()
      }

      if (AppState.currentState === 'active') {
        this._siteManager.exitBackground()
        this._siteManager.refreshSites({ ui: false, fast: true })
      }
    }
  }

  resetToTop() {
    if (this._navigation) {
      this._navigation.dispatch(
        NavigationActions.reset({
          index: 0,
          actions: [NavigationActions.navigate({ routeName: 'Home' })]
        })
      )
    }
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange)

    if (Platform.OS === 'ios') {
      PushNotificationIOS.requestPermissions({ alert: true, badge: true })
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange)
  }

  async openUrl(url, authToken = false) {
    if (Platform.OS === 'ios') {
      if (authToken) {
        Linking.openURL(url)

        this._siteManager.refreshInterval(60000)
      } else {
        let result = await DiscourseSafariViewManager.openAuthSessionAsync(url)

        DiscourseSafariViewManager.dismissBrowser

        if (result.type === 'success') {
          Linking.openURL(result.url)
        } else {
          Alert.alert('Error while authenticating with this Discourse isntance')
        }
      }
    } else {
      if (this.props.simulator) {
        Linking.openURL(url)
      } else {
        ChromeCustomTab.show(url)
          .then(() => {})
          .catch(e => {
            Alert.alert(
              'Discourse requires that Google Chrome Stable is installed.'
            )
          })
      }
    }
  }

  render() {
    return (
      <AppNavigator
        ref={ref => (this._navigation = ref && ref._navigation)}
        style={styles.app}
        screenProps={{
          resetToTop: this.resetToTop.bind(this),
          openUrl: this.openUrl.bind(this),
          seenNotificationMap: this._seenNotificationMap,
          setSeenNotificationMap: map => {
            this._seenNotificationMap = map
          },
          siteManager: this._siteManager
        }}
      />
    )
  }
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: 'white'
  },
  screenContainer: {
    flex: 1
  }
})

export default Discourse
