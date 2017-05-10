/* @flow */
'use strict'

import React from 'react'

import {
  Alert,
  AppState,
  Linking,
  NativeModules,
  Platform,
  StyleSheet
} from 'react-native'

import NavigationExperimental from 'react-native-deprecated-custom-components'

import Screens from './screens'
import SiteManager from './site_manager'
import SafariView from 'react-native-safari-view'

const ChromeCustomTab = NativeModules.ChromeCustomTab

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
        this.resetToTop();
      }

      if (AppState.currentState === 'active') {
        this._siteManager.exitBackground()
        this._siteManager.refreshSites({ui: false, fast: true})
      }
    }
  }

  Home() {
    return {
      id: 'HomeScreen'
    }
  }

  Notifications() {
    return {
      id: 'NotificationsScreen'
    }
  }

  resetToTop() {
    if (this._navigator) {
      this._navigator.immediatelyResetRouteStack([this.Home(), this.Notifications()])
    }
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange)
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange)
  }

  openUrl(url) {
    if (Platform.OS === 'ios') {
      SafariView.show({url})
    } else {
      if (this.props.simulator) {
        Linking.openURL(url)
      } else {
        ChromeCustomTab.show(url)
          .then(()=>{})
          .catch((e)=>{ Alert.alert("Discourse requires that Google Chrome Stable is installed.") })
      }
    }
  }

  render() {
    return (
      <NavigationExperimental.Navigator
        style={styles.app}
        initialRoute={{ identifier: 'HomeScreen', index: 0 }}
        configureScene={(route, routeStack) => {
          switch (route.identifier) {
            case 'NotificationsScreen':
              return NavigationExperimental.Navigator.SceneConfigs.FloatFromBottom
            default:
              return NavigationExperimental.Navigator.SceneConfigs.FloatFromLeft
          }
        }}
        renderScene={(route, navigator) => {
          this._navigator = navigator
          switch (route.identifier) {
            case 'NotificationsScreen':
              return (<Screens.Notifications
                        resetToTop={this.resetToTop.bind(this)}
                        openUrl={this.openUrl.bind(this)}
                        navigator={navigator}
                        seenNotificationMap={this._seenNotificationMap}
                        setSeenNotificationMap={(map)=>{this._seenNotificationMap = map}}
                        siteManager={this._siteManager}/>)
            default:
              return (<Screens.Home
                        openUrl={this.openUrl.bind(this)}
                        navigator={navigator}
                        siteManager={this._siteManager}/>)
          }
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
