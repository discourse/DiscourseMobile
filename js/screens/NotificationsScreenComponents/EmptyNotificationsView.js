/* @flow */
'use strict'

import React from 'react'

import {
  StyleSheet,
  Text,
  View
} from 'react-native'

import colors from '../../colors'

class EmptyNotificationsView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          No notifications yet.
        </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center'
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
    padding: 24,
    textAlign: 'center'
  }
})

export default EmptyNotificationsView
