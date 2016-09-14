/* @flow */
'use strict'

import React from 'react'

import {
  Navigator,
  Platform,
  PushNotificationIOS,
  StyleSheet
} from 'react-native'

import Screens from './screens'

if (Platform.OS === 'ios') {
  PushNotificationIOS.requestPermissions({'alert': true, 'badge': true})
}

class Discourse extends React.Component {
  render() {
    return (
      <Navigator
        style={styles.app}
        initialRoute={{ identifier: 'HomeScreen', index: 0 }}
        configureScene={(route, routeStack) => {
          switch (route.identifier) {
            case 'NotificationsScreen':
              return Navigator.SceneConfigs.FloatFromBottom
            default:
              return Navigator.SceneConfigs.FloatFromLeft
          }
        }}
        renderScene={(route, navigator) => {
          switch (route.identifier) {
            case 'NotificationsScreen':
              return <Screens.Notifications navigator={navigator}/>
            default:
              return <Screens.Home navigator={navigator}/>
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
