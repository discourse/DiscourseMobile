/* @flow */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import {Text, TouchableHighlight, View} from 'react-native';

import _ from 'lodash';

import colors from '../../colors';

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
    return (
      <View style={styles.container}>
        {this._renderTabs(this.props.tabs)}
        <View style={styles.indicator} />
      </View>
    );
  }

  _renderTabs(tabs) {
    return _.map(tabs, (tab, tabIndex) => {
      const selected = this.props.selectedIndex === tabIndex;

      return (
        <TouchableHighlight
          key={tab}
          underlayColor={colors.yellowUIFeedback}
          style={styles.button}
          onPress={() => this.props.onChange(tabIndex)}>
          <Text
            style={[
              styles.buttonText,
              {
                color: selected ? colors.blueCallToAction : colors.grayUI,
                backgroundColor: selected ? 'white' : colors.grayUILight,
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

const styles = {
  container: {
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: colors.grayUILight,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.grayUILight,
  },
  buttonText: {
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    color: colors.grayUI,
    textAlign: 'center',
  },
  indicator: {
    backgroundColor: colors.grayUI,
    height: 3,
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
};

export default Filter;
