/* @flow */
'use strict';

import React, { useContext } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import { ThemeContext } from '../../ThemeContext';

const NavigationBar = props => {
  const theme = useContext(ThemeContext);
  const discourseUrl = 'https://www.discourse.org';

  const renderCogButton = () => {
    if (Platform.OS !== 'android') {
      return;
    }

    return (
      <TouchableHighlight
        style={{ ...styles.androidSettingsButton }}
        underlayColor={'transparent'}
        onPress={props.onDidPressAndroidSettingsIcon}
      >
        <FontAwesome5
          name={'cog'}
          size={20}
          style={{ color: theme.grayUI }}
          iconStyle="solid"
        />
      </TouchableHighlight>
    );
  };

  const renderPlusButton = () => {
    return (
      <TouchableHighlight
        style={{ ...styles.plusButton }}
        underlayColor={'transparent'}
        testID="nav-plus-icon"
        onPress={props.onDidPressPlusIcon}
      >
        <FontAwesome5
          name={'plus'}
          size={20}
          style={{ color: theme.grayUI }}
          iconStyle="solid"
        />
      </TouchableHighlight>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.titleContainer}>
        <TouchableHighlight
          underlayColor={'transparent'}
          onPress={() => Linking.openURL(discourseUrl)}
        >
          <FontAwesome5
            name={'discourse'}
            size={26}
            iconStyle="brand"
            style={{ color: theme.grayTitle }}
          />
        </TouchableHighlight>
      </View>
      {renderCogButton()}
      {renderPlusButton()}
      <View
        style={[styles.separator, { backgroundColor: theme.grayBackground }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 50 : 60,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 0,
  },
  separator: {
    bottom: 0,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  androidSettingsButton: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: 'transparent',
    padding: 12,
  },
  plusButton: {
    position: 'absolute',
    left: 6,
    top: 6,
    backgroundColor: 'transparent',
    padding: 12,
  },
});

export default NavigationBar;
