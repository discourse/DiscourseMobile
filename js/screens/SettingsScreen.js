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

const SettingsScreen = props => {
  const [androidCustomTabs, setAndroidCustomTabs] = React.useState(false);
  const theme = React.useContext(ThemeContext);

  React.useEffect(() => {
    AsyncStorage.getItem('@Discourse.androidCustomTabs').then(val => {
      setAndroidCustomTabs(val ? true : false);
    });
  }, []);

  const toggleAndroidCustomTabs = () => {
    AsyncStorage.getItem('@Discourse.androidCustomTabs').then(val => {
      if (!val) {
        AsyncStorage.setItem('@Discourse.androidCustomTabs', 'true');
        setAndroidCustomTabs(true);
      } else {
        AsyncStorage.removeItem('@Discourse.androidCustomTabs');
        setAndroidCustomTabs(false);
      }
    });
  };

  // TODO: Remove this, it is a feature for Android version < 29
  const toggleDarkMode = () => {
    const newTheme = theme.background === '#FFFFFF' ? 'dark' : 'light';

    AsyncStorage.setItem('@Discourse.androidLegacyTheme', newTheme).then(() => {
      props.screenProps.toggleTheme(newTheme);
    });
  };

  const isDark = !!(theme.background !== '#FFFFFF');

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
      <View
        style={{...styles.container, backgroundColor: theme.grayBackground}}>
        {Platform.OS === 'android' && (
          <View style={styles.settingItem}>
            <Text style={{...styles.text, color: theme.grayTitle}}>
              {i18n.t('browser_toggle_label')}
            </Text>
            <Switch
              onValueChange={toggleAndroidCustomTabs}
              value={androidCustomTabs}
            />
          </View>
        )}
        {Platform.OS === 'android' && Platform.Version < 29 && (
          <View style={styles.settingItem}>
            <Text style={{...styles.text, color: theme.grayTitle}}>
              {i18n.t('switch_dark')}
            </Text>
            <Switch onValueChange={toggleDarkMode} value={isDark} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

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
