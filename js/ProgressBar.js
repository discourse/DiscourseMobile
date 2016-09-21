/* @flow */
'use strict'

import React from 'react'

import { View } from 'react-native'

import Dimensions from 'Dimensions'

import { Bar } from 'react-native-progress'

import colors from './colors'

class ProgressBar extends React.Component {
  render() {
    let height = this.props.progress === 0 ? 0 : 3

    return (
      <View style={[styles.container, {height: height}]}>
        <Bar
          color={colors.blueCallToAction}
          borderWidth={0}
          borderRadius={0}
          height={height}
          progress={this.props.progress}
          width={Dimensions.get('window').width}
        />
      </View>
    )
  }
}

const styles = {
  container: {
    zIndex: 10,
    position:'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: colors.grayBackground
  }
}

export default ProgressBar
