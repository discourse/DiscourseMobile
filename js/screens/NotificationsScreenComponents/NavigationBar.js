/* @flow */
'use strict';

import React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import ProgressBar from '../../ProgressBar';
import {ThemeContext} from '../../ThemeContext';
import i18n from 'i18n-js';

class NavigationBar extends React.Component {
  render() {
    const theme = this.context;
    return (
      <View style={{...styles.container, backgroundColor: theme.background}}>
        <ProgressBar progress={this.props.progress} />
        <View style={styles.titleContainer}>
          <Text style={{...styles.title, color: theme.grayUI}}>
            {this.props.title || i18n.t('notifications')}
          </Text>
        </View>
      </View>
    );
  }
}

NavigationBar.contextType = ThemeContext;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 44 : 55,
  },
  titleContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
  },
});

export default NavigationBar;
