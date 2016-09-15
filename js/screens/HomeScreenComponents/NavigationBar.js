/* @flow */
'use strict'

import React from 'react'

import {
  Image,
  Platform,
  StyleSheet,
  TouchableHighlight,
  View
} from 'react-native'

import Icon from 'react-native-vector-icons/FontAwesome'

import ProgressBar from '../../ProgressBar'
import colors from '../../colors'

class NavigationBar extends React.Component {
  static propTypes = {
    rightButtonIconColor: React.PropTypes.string.isRequired,
    onDidPressRightButton: React.PropTypes.func,
    onDidPressLeftButton: React.PropTypes.func
  }

  render() {
    return (
      <View style={styles.container}>
        <ProgressBar progress={this.props.progress} />
        <View style={styles.leftContainer}>
          {this._renderButton(this.props.onDidPressLeftButton, this.props.leftButtonIconName, colors.grayUI)}
        </View>
        <View style={styles.titleContainer}>
          <Image style={styles.icon} source={require('../../../img/nav-icon-gray.png')} />
        </View>
        <View style={styles.rightContainer}>
          {this._renderButton(this.props.onDidPressRightButton, 'bell', this.props.rightButtonIconColor)}
        </View>
        <View style={styles.separator} />
      </View>
    )
  }

  _renderButton(callback, iconName, color) {
    return (
      <TouchableHighlight
        underlayColor={'white'}
        style={styles.button}
        onPress={callback}>
          <Icon name={iconName} size={20} color={color} />
      </TouchableHighlight>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 64 : 55,
    paddingTop: Platform.OS === 'ios' ? 20 : 0
  },
  leftContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 4
  },
  rightContainer: {
    alignItems: 'flex-end',
    flex: 1,
    justifyContent: 'center',
    paddingRight: 4
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  separator: {
    backgroundColor: colors.grayBackground,
    bottom: 0,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0
  },
  button: {
    padding: 8
  }
})

export default NavigationBar
