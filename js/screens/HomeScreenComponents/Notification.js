/* @flow */
'use strict';

import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContext } from '../../ThemeContext';
import FontAwesome5 from "@react-native-vector-icons/fontawesome5";

const Notification = props => {
  const theme = useContext(ThemeContext);

  if (!props.count) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={{ ...styles.number, backgroundColor: props.color }}>
        <Text style={{ ...styles.numberText, color: theme.buttonTextColor }}>
          <View style={{ paddingRight: 6 }}>
            <FontAwesome5
              name={props.icon}
              iconStyle="solid"
              size={11}
              color={theme.buttonTextColor}
            />
          </View>
          <Text>{props.count}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    marginLeft: 5,
  },
  number: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 5,
  },
  numberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Notification;
