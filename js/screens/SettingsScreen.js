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

import {ThemeContext} from '../ThemeContext';
import i18n from 'i18n-js';

class SettingsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
      androidCustomTabs: false,
      hotTopicsHidden: false,
      homeSiteUrlsHidden: false,
    };

    AsyncStorage.getItem('@Discourse.androidCustomTabs').then(val => {
      this.setState({
        androidCustomTabs: val ? true : false,
      });
    });

    AsyncStorage.getItem('@Discourse.hideHotTopics').then(val => {
      this.setState({
        hotTopicsHidden: val ? true : false,
      });
    });

    AsyncStorage.getItem('@Discourse.hideHomeSiteUrls').then(val => {
      this.setState({
        homeSiteUrlsHidden: val ? true : false,
      });
    });

    this.toggleAndroidCustomTabs = this.toggleAndroidCustomTabs.bind(this);
    this.toggleDarkMode = this.toggleDarkMode.bind(this);
    this.hideHotTopics = this.hideHotTopics.bind(this);
    this.hideHomeSiteUrls = this.hideHomeSiteUrls.bind(this);
  }

  render() {
    const theme = this.context;
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
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

    AsyncStorage.setItem('@Discourse.androidLegacyTheme', newTheme).then(() => {
      this.props.screenProps.toggleTheme(newTheme);
    });
  }

  hideHotTopics() {
    AsyncStorage.getItem('@Discourse.hideHotTopics').then(val => {
      if (!val) {
        AsyncStorage.setItem('@Discourse.hideHotTopics', 'true');
        this.setState({hotTopicsHidden: true});
      } else {
        AsyncStorage.removeItem('@Discourse.hideHotTopics');
        this.setState({hotTopicsHidden: false});
      }
    });
  }

  hideHomeSiteUrls() {
    AsyncStorage.getItem('@Discourse.hideHomeSiteUrls').then(val => {
      if (!val) {
        AsyncStorage.setItem('@Discourse.hideHomeSiteUrls', 'true');
        this.setState({homeSiteUrlsHidden: true});
      } else {
        AsyncStorage.removeItem('@Discourse.hideHomeSiteUrls');
        this.setState({homeSiteUrlsHidden: false});
      }
    });
  }

  _renderSettings() {
    const theme = this.context;
    const isDark = !!(theme.background !== '#FFFFFF');
    return (
      <View
        style={{...styles.container, backgroundColor: theme.grayBackground}}>
        <View>
          <Text style={{...styles.settingHeading, color: theme.graySubtitle}}>
            {i18n.t('home_layout_heading')}
          </Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={{...styles.text, color: theme.grayTitle}}>
            {i18n.t('disable_hot_topics_toggle_label')}
          </Text>
          <Switch
            onValueChange={this.hideHotTopics}
            value={this.state.hotTopicsHidden}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={{...styles.text, color: theme.grayTitle}}>
            {i18n.t('disable_home_site_urls_toggle_label')}
          </Text>
          <Switch
            onValueChange={this.hideHomeSiteUrls}
            value={this.state.homeSiteUrlsHidden}
          />
        </View>
        {Platform.OS === 'android' && (
          <View>
            <Text style={{...styles.settingHeading, color: theme.graySubtitle}}>
              {i18n.t('other_heading')}
            </Text>
          </View>
        )}
        {Platform.OS === 'android' && (
          <View style={styles.settingItem}>
            <Text style={{...styles.text, color: theme.grayTitle}}>
              {i18n.t('browser_toggle_label')}
            </Text>
            <Switch
              onValueChange={this.toggleAndroidCustomTabs}
              value={this.state.androidCustomTabs}
            />
          </View>
        )}
        {Platform.OS === 'android' && Platform.Version < 29 && (
          <View style={styles.settingItem}>
            <Text style={{...styles.text, color: theme.grayTitle}}>
              {i18n.t('switch_dark')}
            </Text>
            <Switch onValueChange={this.toggleDarkMode} value={isDark} />
          </View>
        )}
      </View>
    );
  }
}

SettingsScreen.contextType = ThemeContext;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  settingItem: {
    alignItems: 'center',
    backgroundColor: 'white',
    justifyContent: 'space-between',
    flexDirection: 'row',
    margin: 10,
    padding: 10,
    borderRadius: 10,
    width: '95%',
  },
  text: {
    fontSize: 18,
    padding: 12,
    textAlign: 'center',
  },
  settingHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 12,
    paddingTop: 24,
    textAlign: 'center',
  },
  desc: {
    fontSize: 15,
    padding: 10,
    paddingTop: 4,
  },
});

export default SettingsScreen;
