/* @flow */
'use strict'

import React from 'react'

import PropTypes from 'prop-types'

import { SegmentedControlIOS, View } from 'react-native'

import colors from '../../colors'

class Filter extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    selectedIndex: PropTypes.number.isRequired
  }

  render() {
    return (
      <View style={styles.container}>
        <SegmentedControlIOS
          values={this.props.tabs}
          tintColor={colors.grayUI}
          style={styles.segmentedControl}
          selectedIndex={this.props.selectedIndex}
          onChange={event => {
            this.props.onChange(event.nativeEvent.selectedSegmentIndex)
          }}
        />
      </View>
    )
  }
}

const styles = {
  container: {
    backgroundColor: 'white',
    flex: 1
  },
  segmentedControl: {
    margin: 12
  }
}

export default Filter
