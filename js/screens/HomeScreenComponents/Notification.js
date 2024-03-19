/* @flow */
'use strict';

import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ThemeContext} from '../../ThemeContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const Notification = props => {
  const theme = useContext(ThemeContext);

  if (!props.count) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={{...styles.number, backgroundColor: props.color}}>
        <Text style={{...styles.numberText, color: theme.buttonTextColor}}>
          <View style={{paddingRight: 6}}>
            <FontAwesome5
              name={props.icon}
              solid
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
    marginBottom: 6,
    marginLeft: 6,
  },
  number: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 6,
  },
  numberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Notification;
