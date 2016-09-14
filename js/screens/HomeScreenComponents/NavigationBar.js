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

class NavigationBar extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          <TouchableHighlight
            underlayColor={'white'}
            style={styles.button}
            onPress={this.props.onDidPressLeftButton}>
            <Icon name={this.props.leftButtonIconName} size={20} color="#919191" />
          </TouchableHighlight>
        </View>
        <View style={styles.titleContainer}>
          <Image style={styles.icon} source={require('../../../img/nav-icon-gray.png')} />
        </View>
        <View style={styles.rightContainer}>
          <TouchableHighlight
            underlayColor={'white'}
            style={styles.button}
            onPress={this.props.onDidPressRightButton}>
            <Icon name="bell" size={20} color="#919191" />
          </TouchableHighlight>
        </View>
        <View style={styles.separator}/>
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
    paddingLeft: 4,
    justifyContent: 'center'
  },
  rightContainer: {
    flex: 1,
    paddingRight: 4,
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
    backgroundColor: '#f5f8fa'
  },
  button: {
    padding: 8
  }
})

export default NavigationBar
