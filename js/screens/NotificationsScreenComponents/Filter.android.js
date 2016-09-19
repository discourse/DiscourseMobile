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

import _ from 'lodash'

import colors from '../../colors'

class Filter extends React.Component {
  static propTypes = {
    onChange: React.PropTypes.func.isRequired,
    selectedIndex: React.PropTypes.number.isRequired,
    tabs: React.PropTypes.array
  }

  constructor(props) {
    super(props)

    this.state = {
      indicatorWidth: Dimensions.get('window').width / props.tabs.length,
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
        {this._renderTabs(this.props.tabs)}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: this.state.indicatorWidth,
              left:this._indicatorLeftPosition()
            }
          ]}
        />
      </View>
    )
  }

  _renderTabs(tabs) {
    return _.map(tabs, (tab, tabIndex) => {
      return (
        <TouchableHighlight
          underlayColor={colors.grayUI}
          style={[styles.button]}
          onPress={() => this.onDidSelect(tabIndex)}>
            <Text style={styles.buttonText}>
              {tab.toUpperCase()}
            </Text>
        </TouchableHighlight>
      )
    })
  }

  _indicatorLeftPosition() {
    return this.state.selectedIndex.interpolate({
      inputRange: [0, 1],
      outputRange: [0, this.state.indicatorWidth]
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
    bottom: 0
  }
}

export default Filter
