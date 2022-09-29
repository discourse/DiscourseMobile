/* @flow */
'use strict';

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Components from './NotificationsScreenComponents';
import {ThemeContext} from '../ThemeContext';
import i18n from 'i18n-js';

class SettingsScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      progress: 0,
      androidCustomTabs: false,
    };

    AsyncStorage.getItem('@Discourse.androidCustomTabs').then(val => {
      this.setState({
        androidCustomTabs: val ? true : false,
      });
    });

    this.toggleAndroidCustomTabs = this.toggleAndroidCustomTabs.bind(this);
    this.toggleDarkMode = this.toggleDarkMode.bind(this);
  }

  render() {
    const theme = this.context;
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
        <Components.NavigationBar
          onDidPressRightButton={() => this._onDidPressRightButton()}
          progress={this.state.progress}
          title={i18n.t('settings')}
        />

        {this._renderSettings()}
      </SafeAreaView>
    );
  }

  toggleAndroidCustomTabs() {
    AsyncStorage.getItem('@Discourse.androidCustomTabs').then(val => {
      if (!val) {
        AsyncStorage.setItem('@Discourse.androidCustomTabs', 'true');
        this.setState({androidCustomTabs: true});
      } else {
        AsyncStorage.removeItem('@Discourse.androidCustomTabs');
        this.setState({androidCustomTabs: false});
      }
    });
  }

  toggleDarkMode() {
    const theme = this.context;
    const newTheme = theme.background === '#FFFFFF' ? 'dark' : 'light';

    AsyncStorage.setItem('@Discourse.androidLegacyTheme', newTheme).done(() => {
      this.props.screenProps.toggleTheme(newTheme);
    });
  }

  _renderSettings() {
    const theme = this.context;
    const isDark = !!(theme.background !== '#FFFFFF');
    return (
      <View style={styles.container}>
        <View style={styles.settingItem}>
          <Text style={{...styles.text, color: theme.grayTitle}}>
            {i18n.t('browser_toggle_label')}
          </Text>
          <Switch
            onValueChange={this.toggleAndroidCustomTabs}
            value={this.state.androidCustomTabs}
          />
          <Text style={{...styles.desc, color: theme.grayTitle}}>
            {i18n.t('browser_toggle_description')}
          </Text>
        </View>
        {Platform.OS === 'android' && Platform.Version < 29 && (
          <View style={styles.settingItem}>
            <Text style={{...styles.text, color: theme.grayTitle}}>
              {i18n.t('switch_dark')}
            </Text>
            <Switch onValueChange={this.toggleDarkMode} value={isDark} />
            <Text style={{...styles.desc, color: theme.grayTitle}}>
              {i18n.t('browser_toggle_description')}
            </Text>
          </View>
        )}
      </View>
    );
  }

  _onDidPressRightButton() {
    this.props.navigation.goBack();
  }
}

SettingsScreen.contextType = ThemeContext;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    flex: 5,
  },
  settingItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 20,
    padding: 12,
    paddingBottom: 24,
    textAlign: 'center',
  },
  desc: {
    fontSize: 16,
    padding: 12,
    paddingTop: 24,
    textAlign: 'center',
  },
});

export default SettingsScreen;
