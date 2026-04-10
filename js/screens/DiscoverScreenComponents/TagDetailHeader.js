/* @flow */
'use strict';

import React, { useContext } from 'react';
import { Platform, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import { ThemeContext } from '../../ThemeContext';

const TagDetailHeader = props => {
  const theme = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <TouchableHighlight
          style={styles.backButton}
          underlayColor={theme.grayBackground}
          onPress={props.onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <FontAwesome5
            name={'arrow-left'}
            size={18}
            color={theme.grayTitle}
            iconStyle="solid"
          />
        </TouchableHighlight>
        <Text
          style={[styles.title, { color: theme.grayTitle }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {props.title}
        </Text>
      </View>
      <View
        style={[styles.separator, { backgroundColor: theme.grayBorder }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? 48 : 60,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  separator: {
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});

export default TagDetailHeader;
