/* @flow */
'use strict';

import React, { useContext } from 'react';
import {
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import { ThemeContext } from '../../ThemeContext';

const NavigationBar = () => {
  const theme = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.titleContainer}>
        <FontAwesome5
          name={'discourse'}
          size={26}
          iconStyle="brand"
          style={{ color: theme.grayTitle }}
        />
      </View>
      <View
        style={[styles.separator, { backgroundColor: theme.grayBackground }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 48 : 60,
    marginBottom: 14,
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
});

export default NavigationBar;
