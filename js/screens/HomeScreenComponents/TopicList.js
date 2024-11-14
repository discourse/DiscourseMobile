/* @flow */
'use strict';

import React, {useContext} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import {ThemeContext} from '../../ThemeContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
// import i18n from 'i18n-js';

const DebugRow = props => {
  // const theme = useContext(ThemeContext);

  return <View style={styles.container} />;
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    marginLeft: 16,
  },
});

export default DebugRow;
