/* @flow */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {SegmentedControlIOS, View} from 'react-native';

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
        <SegmentedControlIOS
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
