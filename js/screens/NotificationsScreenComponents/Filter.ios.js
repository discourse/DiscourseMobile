/* @flow */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import SegmentedControl from '@react-native-community/segmented-control';

import {ThemeContext} from '../../ThemeContext';

class Filter extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    selectedIndex: PropTypes.number.isRequired,
  };

  render() {
    const theme = this.context;
    return (
      <View style={{flex: 0, backgroundColor: theme.background}}>
        <SegmentedControl
          values={this.props.tabs}
          tintColor={theme.grayUI}
          style={{margin: 12}}
          selectedIndex={this.props.selectedIndex}
          onChange={event => {
            this.props.onChange(event.nativeEvent.selectedSegmentIndex);
          }}
        />
      </View>
    );
  }
}
Filter.contextType = ThemeContext;

export default Filter;
