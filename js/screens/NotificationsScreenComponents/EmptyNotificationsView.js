/* @flow */
'use strict'

import React from 'react'

import {
  StyleSheet,
  Text,
  View
} from 'react-native'

import Icon from 'react-native-vector-icons/FontAwesome'

import colors from '../../colors'

class EmptyNotificationsView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Icon name={'bell'} size={26} color={colors.grayUI}/>
        <Text style={styles.text}>
          No new notifications.
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
    color: colors.grayTitle,
    fontSize: 16,
    marginBottom: 12,
    padding: 24,
    textAlign: 'center'
  }
})

export default EmptyNotificationsView
