/* @flow */
'use strict';

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import {ThemeContext} from '../../ThemeContext';

class EmptyNotificationsView extends React.Component {
  render() {
    const theme = this.context;
    return (
      <View style={styles.container}>
        <FontAwesome5 name={'bell'} size={26} color={theme.grayUI} solid />
        <Text style={{...styles.text, color: theme.grayTitle}}>
          {this.props.text}
        </Text>
      </View>
    );
  }
}
EmptyNotificationsView.contextType = ThemeContext;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    flex: 5,
  },
  text: {
    fontSize: 16,
    marginBottom: 48,
    padding: 24,
    paddingTop: 12,
    textAlign: 'center',
  },
});

export default EmptyNotificationsView;
