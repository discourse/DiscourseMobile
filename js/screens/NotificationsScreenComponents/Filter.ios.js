/* @flow */
'use strict'

import React from 'react'
import {
  SegmentedControlIOS,
  View
} from 'react-native'

class Filter extends React.Component {
  render() {
    return (
      <View style={{backgroundColor: 'white', flex:1}}>
        <SegmentedControlIOS
          values={['Replies', 'All']}
          tintColor={'#919191'}
          style={{margin: 12}}
          selectedIndex={this.props.selectedIndex}
          onChange={(event) => {
            this.props.onChange(event.nativeEvent.selectedSegmentIndex)
          }}
        />
      </View>
    )
  }
}

export default Filter
