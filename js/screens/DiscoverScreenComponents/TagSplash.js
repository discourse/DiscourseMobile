/* @flow */
'use strict';

import React, {useContext} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import {ThemeContext} from '../../ThemeContext';
import i18n from 'i18n-js';

const TagSplash = props => {
  const theme = useContext(ThemeContext);

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: theme.background}}
      contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={{...styles.prompt, color: theme.grayTitle}}>
          {i18n.t('discover_pick_tag')}
        </Text>
      </View>
      <View style={styles.tagGrid}>
        {props.tags.map(tag => (
          <TouchableHighlight
            key={tag.value}
            style={{
              ...styles.tagButton,
              borderColor: theme.grayUILight,
              backgroundColor: theme.background,
            }}
            underlayColor={theme.grayBackground}
            onPress={() => props.onSelectTag(tag.value)}>
            <Text style={{...styles.tagLabel, color: theme.grayTitle}}>
              {tag.label}
            </Text>
          </TouchableHighlight>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  prompt: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tagButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    margin: 6,
  },
  tagLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TagSplash;
