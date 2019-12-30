/* @flow */
'use strict';

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ThemeContext} from '../../ThemeContext';

class Notification extends React.Component {
  render() {
    const theme = this.context;
    if (this.props.count > 0) {
      return (
        <View style={styles.container}>
          <View style={[styles.number, {backgroundColor: this.props.color}]}>
            <Text style={{...styles.numberText, color: theme.buttonTextColor}}>
              {this.props.count}
            </Text>
          </View>
        </View>
      );
    } else {
      return null;
    }
  }
}
Notification.contextType = ThemeContext;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    marginBottom: 6,
    marginLeft: 6,
  },
  number: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 6,
  },
  numberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Notification;
