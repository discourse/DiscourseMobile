/* @flow */
'use strict'

import React from 'react'
import Dimensions from 'Dimensions'

import { Bar } from 'react-native-progress'

import colors from './colors'

class ProgressBar extends React.Component {
  render() {
    return (
      <Bar
        color={colors.yellowUIFeedback}
        borderWidth={0}
        borderRadius={0}
        style={{position:'absolute', bottom: 0, left: 0, zIndex: 10}}
        height={this.props.progress === 0 ? 0 : 3}
        progress={this.props.progress}
        width={Dimensions.get('window').width}
      />
    )
  }
}

export default ProgressBar
