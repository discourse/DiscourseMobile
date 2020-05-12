/* @flow */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import {
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import ProgressBar from '../../ProgressBar';
import {ThemeContext} from '../../ThemeContext';

class NavigationBar extends React.Component {
  static propTypes = {
    onDidPressLeftButton: PropTypes.func,
    onDidPressRightButton: PropTypes.func,
  };

  render() {
    const theme = this.context;
    // not sure we need a refresh button for now, it live refreshes
    // {this._renderButton(this.props.onDidPressLeftButton, 'refresh')}
    return (
      <View style={{...styles.container, backgroundColor: theme.background}}>
        <ProgressBar progress={this.props.progress} />
        <View style={styles.leftContainer} />
        <View style={styles.titleContainer}>
          <Text style={{...styles.title, color: theme.grayUI}}>
            Notifications
          </Text>
        </View>
        <View style={styles.rightContainer}>
          {this._renderButton(
            this.props.onDidPressRightButton,
            'times',
            'Dismiss',
          )}
        </View>
        <View
          style={{...styles.separator, backgroundColor: theme.grayBackground}}
        />
      </View>
    );
  }

  _renderButton(callback, iconName, label) {
    const theme = this.context;
    return (
      <TouchableHighlight
        underlayColor={theme.background}
        accessibilityLabel={label}
        style={styles.button}
        onPress={callback}>
        <FontAwesome5 name={iconName} size={20} color={theme.grayUI} />
      </TouchableHighlight>
    );
  }
}

NavigationBar.contextType = ThemeContext;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 44 : 55,
  },
  leftContainer: {
    flex: 1,
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  title: {
    fontSize: 16,
  },
  button: {
    width: Platform.OS === 'ios' ? 44 : 55,
    height: Platform.OS === 'ios' ? 44 : 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NavigationBar;
