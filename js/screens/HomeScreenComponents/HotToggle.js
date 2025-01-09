/* @flow */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import SegmentedControl from '@react-native-community/segmented-control';

class HotToggle extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    selectedIndex: PropTypes.number.isRequired,
  };

  render() {
    return (
      <View
        style={{
          flex: 0,
          marginHorizontal: '20%',
        }}>
        <SegmentedControl
          values={this.props.tabs}
          style={{margin: 12, opacity: 0.85}}
          selectedIndex={this.props.selectedIndex}
          onChange={event => {
            this.props.onChange(event.nativeEvent.selectedSegmentIndex);
          }}
        />
      </View>
    );
  }
}

export default HotToggle;
