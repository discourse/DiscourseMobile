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
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import i18n from 'i18n-js';

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

  renderCogButton() {
    const theme = this.context;
    if (Platform.OS === 'android') {
      return (
        <TouchableHighlight
          style={{...styles.androidSettingsButton}}
          underlayColor={'transparent'}
          onPress={this.props.onDidPressAndroidSettingsIcon}>
          <FontAwesome5
            name={'cog'}
            size={20}
            style={{color: theme.grayUI}}
            solid
          />
        </TouchableHighlight>
      );
    }
  }

  render() {
    const theme = this.context;
    return (
      <View style={[styles.container, {backgroundColor: theme.background}]}>
        <Text style={styles.debugText}>
          {i18n.t('last_updated')}{' '}
          {Moment(this.state.lastRefresh).format('h:mmA')}
        </Text>
        {this.renderCogButton()}
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
    height: 35,
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
    paddingLeft: 12,
  },
  androidSettingsButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
});

DebugRow.contextType = ThemeContext;

export default DebugRow;
