/* @flow */
'use strict';

import React, {useContext} from 'react';
import {View} from 'react-native';
import SegmentedControl from '@react-native-community/segmented-control';
import {ThemeContext} from '../../ThemeContext';

const Filter = props => {
  const theme = useContext(ThemeContext);
  return (
    <View
      style={{
        flex: 0,
        backgroundColor: theme.background,
        marginHorizontal: props.marginHorizontal,
      }}>
      <SegmentedControl
        values={props.tabs}
        style={{
          margin: 12,
          opacity: 0.85,
        }}
        selectedIndex={props.selectedIndex}
        onChange={event => {
          props.onChange(event.nativeEvent.selectedSegmentIndex);
        }}
      />
    </View>
  );
};

export default Filter;
