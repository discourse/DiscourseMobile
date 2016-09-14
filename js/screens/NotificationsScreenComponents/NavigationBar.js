/* @flow */
'use strict'

import React from 'react'

import {
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View
} from 'react-native'

import Icon from 'react-native-vector-icons/FontAwesome'

import colors from '../../colors'

class NavigationBar extends React.Component {
  static propTypes = {
    onDidPressRightButton: React.PropTypes.func
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.leftContainer} />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Notifications
          </Text>
        </View>
        <View style={styles.rightContainer}>
          <TouchableHighlight
            underlayColor={'white'}
            style={styles.button}
            onPress={this.props.onDidPressRightButton}>
            <Icon name="close" size={20} color={colors['grayUI']} />
          </TouchableHighlight>
        </View>
        <View style={styles.separator} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    height: Platform.OS === 'ios' ? 64 : 55
  },
  leftContainer: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center'
  },
  rightContainer: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  separator: {
    height: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors['grayBackground']
  },
  title: {
    color: colors['grayUI'],
    fontSize: 16
  },
  button: {
    padding: 8
  }
})

export default NavigationBar
