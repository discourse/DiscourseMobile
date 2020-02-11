/* @flow */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import {Text, TouchableHighlight, View} from 'react-native';

import _ from 'lodash';

import {ThemeContext} from '../../ThemeContext';

class Filter extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    selectedIndex: PropTypes.number.isRequired,
    tabs: PropTypes.array,
  };

  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: props.selectedIndex,
    };
  }

  render() {
    const theme = this.context;
    return (
      <View style={{...styles.container, backgroundColor: theme.grayUILight}}>
        {this._renderTabs(this.props.tabs)}
        <View style={{...styles.indicator, backgroundColor: theme.grayUI}} />
      </View>
    );
  }

  _renderTabs(tabs) {
    const theme = this.context;
    return _.map(tabs, (tab, tabIndex) => {
      const selected = this.props.selectedIndex === tabIndex;

      return (
        <TouchableHighlight
          key={tab}
          underlayColor={theme.yellowUIFeedback}
          style={{...styles.button, backgroundColor: theme.grayUILight}}
          onPress={() => this.props.onChange(tabIndex)}>
          <Text
            style={[
              styles.buttonText,
              {
                color: selected ? theme.blueCallToAction : theme.grayUI,
                backgroundColor: selected
                  ? theme.background
                  : theme.grayUILight,
              },
            ]}>
            {tab.toUpperCase()}
          </Text>
        </TouchableHighlight>
      );
    });
  }

  _indicatorColor() {
    return this.state.selectedIndex.interpolate({
      inputRange: [0, 1],
      outputRange: ['black', 'blue'],
    });
  }
}
Filter.contextType = ThemeContext;

const styles = {
  container: {
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    flexDirection: 'column',
  },
  buttonText: {
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  indicator: {
    height: 3,
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
};

export default Filter;
