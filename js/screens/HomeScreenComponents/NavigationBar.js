/* @flow */
'use strict'

import React from 'react'

import {
  Animated,
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
    leftButtonIconRotated: React.PropTypes.bool.isRequired,
    rightButtonIconColor: React.PropTypes.string.isRequired,
    onDidPressRightButton: React.PropTypes.func.isRequired,
    onDidPressLeftButton: React.PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      rotationValue: new Animated.Value(props.leftButtonIconRotated ? 1 : 0)
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.leftButtonIconRotated !== this.props.leftButtonIconRotated ||
           nextProps.progress !== this.props.progress
  }

  componentWillReceiveProps(props) {
    if (this.props.leftButtonIconRotated !== props.leftButtonIconRotated) {
      Animated.spring(
        this.state.rotationValue, {
          toValue: props.leftButtonIconRotated ? 1 : 0,
          duration: 50
        }
      ).start()
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <ProgressBar progress={this.props.progress} />
        <View style={styles.leftContainer}>
          <TouchableHighlight
            underlayColor={'white'}
            style={[styles.button]}
            onPress={this.props.onDidPressLeftButton}>
              <AnimatedIcon
                name="plus"
                color={colors.grayUI}
                size={20}
                style={[
                  styles.animatedIcon,
                  {transform: [{
                    rotate: this.state.rotationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '225deg']
                    })
                  }]}
                ]}
              />
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
              <Icon name={'bell'} color={this.props.rightButtonIconColor} size={20} />
          </TouchableHighlight>
        </View>
        <View style={styles.separator} />
      </View>
    )
  }
}

const AnimatedIcon = Animated.createAnimatedComponent(Icon)

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 64 : 55,
    paddingTop: Platform.OS === 'ios' ? 20 : 0
  },
  leftContainer: {
    flex: 1
  },
  rightContainer: {
    alignItems: 'flex-end',
    flex: 1
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
  animatedIcon: {
    backgroundColor: 'transparent',
  },
  button: {
    width: Platform.OS === 'ios' ? 44 : 55,
    height: Platform.OS === 'ios' ? 44 : 55,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default NavigationBar
