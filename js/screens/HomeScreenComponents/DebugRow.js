/* @flow */
'use strict';

import React, {useContext, useEffect, useState} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import Moment from 'moment';
import {ThemeContext} from '../../ThemeContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import i18n from 'i18n-js';

const DebugRow = props => {
  const theme = useContext(ThemeContext);
  const [lastRefresh, setLastRefresh] = useState(props.siteManager.lastRefresh);

  const _subscription = () => {
    setLastRefresh(props.siteManager.lastRefresh);
  };

  useEffect(() => {
    props.siteManager.subscribe(_subscription);

    return () => {
      props.siteManager.unsubscribe(_subscription);
    };
  });

  const renderCogButton = () => {
    if (Platform.OS !== 'android') {
      return null;
    }

    return (
      <TouchableHighlight
        style={{...styles.androidSettingsButton}}
        underlayColor={'transparent'}
        onPress={props.onDidPressAndroidSettingsIcon}>
        <FontAwesome5
          name={'cog'}
          size={20}
          style={{color: theme.grayUI}}
          solid
        />
      </TouchableHighlight>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <Text style={styles.debugText}>
        {i18n.t('last_updated')} {Moment(lastRefresh).format('h:mmA')}
      </Text>
      {renderCogButton()}
    </View>
  );
};

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

export default DebugRow;
