/* @flow */
'use strict';

import React from 'react';

import {
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import Moment from 'moment';
import {ThemeContext} from '../../ThemeContext';
import AsyncStorage from '@react-native-community/async-storage';

class DebugRow extends React.Component {
  componentDidMount() {
    this._subscription = () => {
      this.setState({
        firstFetch: this.props.siteManager.firstFetch,
        lastFetch: this.props.siteManager.lastFetch,
        fetchCount: this.props.siteManager.fetchCount,
        lastRefresh: this.props.siteManager.lastRefresh,
      });
    };
    this.props.siteManager.subscribe(this._subscription);

    AsyncStorage.getItem('@Discourse.androidLegacyTheme').then(theme => {
      if (!theme) {
        theme = 'light';
      }
      this.setState({
        themeOverride: theme,
      });
    });
  }

  componentWillUnmount() {
    this.props.siteManager.unsubscribe(this._subscription);
    this._subscription = null;
  }

  constructor(props) {
    super(props);

    this.state = {
      firstFetch: this.props.siteManager.firstFetch,
      lastFetch: this.props.siteManager.lastFetch,
      fetchCount: this.props.siteManager.fetchCount,
      lastRefresh: this.props.siteManager.lastRefresh,
    };
  }

  toggleTheme = () => {
    const theme = this.context;
    const newTheme = theme.background === '#FFFFFF' ? 'dark' : 'light';
    AsyncStorage.setItem('@Discourse.androidLegacyTheme', newTheme).done(() => {
      this.props.toggleTheme(newTheme);
    });
  };

  renderDarkModeToggle() {
    if (Platform.OS === 'android' && Platform.Version < 29) {
      const theme = this.context;

      const label =
        theme.background === '#FFFFFF'
          ? 'Switch to dark theme'
          : 'Switch to light theme';
      return (
        <TouchableHighlight
          underlayColor={'transparent'}
          onPress={this.toggleTheme}>
          <Text style={styles.darkModeToggle}>{label}</Text>
        </TouchableHighlight>
      );
    }
    return false;
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.debugText}>
          Last Updated: {Moment(this.state.lastRefresh).format('h:mmA')}
        </Text>
        {this.renderDarkModeToggle()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 5,
    bottom: 0,
    padding: 0,
    width: '100%',
    height: 30,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  darkModeToggle: {
    color: '#666',
    fontSize: 11,
    padding: 6,
  },
  debugText: {
    color: '#777',
    fontSize: 11,
    padding: 6,
  },
});
DebugRow.contextType = ThemeContext;

export default DebugRow;
