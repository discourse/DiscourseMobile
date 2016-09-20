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

import ProgressBar from '../../ProgressBar'
import colors from '../../colors'

class NavigationBar extends React.Component {
  static propTypes = {
    onDidPressLeftButton: React.PropTypes.func,
    onDidPressRightButton: React.PropTypes.func
  }

  render() {
    // not sure we need a refresh button for now, it live refreshes
    // {this._renderButton(this.props.onDidPressLeftButton, 'refresh')}
    return (
      <View style={styles.container}>
        <ProgressBar progress={this.props.progress} />
        <View style={styles.leftContainer}>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Notifications
          </Text>
        </View>
        <View style={styles.rightContainer}>
          {this._renderButton(this.props.onDidPressRightButton, 'close')}
        </View>
        <View style={styles.separator} />
      </View>
    )
  }

  _renderButton(callback, iconName) {
    return (
      <TouchableHighlight
        underlayColor={'white'}
        style={styles.button}
        onPress={callback}>
        <Icon name={iconName} size={20} color={colors.grayUI} />
      </TouchableHighlight>
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
    flex: 1
  },
  rightContainer: {
    flex: 1,
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
    backgroundColor: colors.grayBackground
  },
  title: {
    color: colors.grayUI,
    fontSize: 16
  },
  button: {
    width: Platform.OS === 'ios' ? 44 : 55,
    height: Platform.OS === 'ios' ? 44 : 55,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default NavigationBar
