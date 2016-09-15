/* @flow */
'use strict'

import React from 'react'
import {
  Animated,
  Easing,
  Text,
  TouchableHighlight,
  View
} from 'react-native'

import Dimensions from 'Dimensions'

import colors from '../../colors'

class Filter extends React.Component {
  static propTypes = {
    onChange: React.PropTypes.func.isRequired,
    selectedIndex: React.PropTypes.number.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      selectedIndex: new Animated.Value(props.selectedIndex)
    }
  }

  onDidSelect(index) {
    Animated.timing(this.state.selectedIndex, {
      easing: Easing.inOut(Easing.ease),
      duration: 250,
      toValue: index
    }).start()

    this.props.onChange(index)
  }

  render() {
    return (
      <View style={styles.container}>
        <TouchableHighlight
          underlayColor={colors.grayUI}
          style={[styles.button]}
          onPress={() => this.onDidSelect(0)}>
            <Text style={styles.buttonText}>
              REPLIES
            </Text>
        </TouchableHighlight>
        <TouchableHighlight
          underlayColor={colors.grayUI}
          style={[styles.button]}
          onPress={() => this.onDidSelect(1)}>
            <Text style={styles.buttonText}>
              ALL
            </Text>
        </TouchableHighlight>
        <Animated.View style={[styles.indicator, {left:this._indicatorLeftPosition()}]} />
      </View>
    )
  }

  _indicatorLeftPosition() {
    return this.state.selectedIndex.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Dimensions.get('window').width / 2]
    })
  }
}

const styles = {
  container: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: colors.grayUILight,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.grayUILight
  },
  buttonText: {
    padding: 16,
    fontSize: 14,
    fontWeight: '500',
    color: colors.grayUI,
    textAlign: 'center'
  },
  indicator: {
    backgroundColor: colors.grayUI,
    height: 3,
    position: 'absolute',
    bottom: 0,
    width: Dimensions.get('window').width / 2
  }
}

export default Filter
