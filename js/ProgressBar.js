/* @flow */
'use strict'

import React from 'react'
import Dimensions from 'Dimensions'

import { Bar } from 'react-native-progress'

class ProgressBar extends React.Component {
  render() {
    return (
      <Bar
        color="#ffffa6"
        borderWidth={0}
        borderRadius={0}
        style={{position:'absolute', zIndex: 10}}
        height={this.props.progress === 0 ? 0 : 3}
        progress={this.props.progress}
        width={Dimensions.get('window').width}
      />
    )
  }
}

export default ProgressBar
