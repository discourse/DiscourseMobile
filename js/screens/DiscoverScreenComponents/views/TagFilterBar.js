/* @flow */
'use strict';

import React, { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableHighlight } from 'react-native';
import i18n from 'i18n-js';

import { ThemeContext } from '../../../ThemeContext';
import { PRIMARY_TAGS } from '../TagSplash';

const TagFilterBar = props => {
  const theme = useContext(ThemeContext);
  const { activeKey, splashTags, largerUI, onSelect } = props;

  const primaryTagSet = new Set(PRIMARY_TAGS.map(t => t.tag));
  const secondaryTags = (splashTags || [])
    .filter(tag => !primaryTagSet.has(tag))
    .sort((a, b) => a.localeCompare(b));

  const entries = [
    { key: null, label: i18n.t('discover_all') },
    ...PRIMARY_TAGS.map(({ tag, label }) => ({
      key: tag,
      label: label,
    })),
    { key: 'recent', label: i18n.t('discover_recent') },
    ...secondaryTags.map(tag => ({
      key: tag,
      label: tag,
    })),
  ];

  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      style={styles.tagBar}
      contentContainerStyle={styles.tagBarContent}
      keyboardShouldPersistTaps="handled"
    >
      {entries.map(entry => {
        const isSelected = entry.key === activeKey;
        return (
          <TouchableHighlight
            key={entry.key === null ? '__all__' : entry.key}
            accessibilityRole="button"
            accessibilityLabel={entry.label}
            style={{
              ...styles.tagBarItem,
              borderColor: theme.grayUILight,
              backgroundColor: isSelected
                ? theme.grayBackground
                : theme.background,
            }}
            underlayColor={theme.grayBackground}
            onPress={() => onSelect(entry.key)}
          >
            <Text
              style={{
                ...styles.tagBarItemText,
                color: theme.tagButtonTextColor,
                fontSize: largerUI ? 15 : 13,
              }}
            >
              {entry.label}
            </Text>
          </TouchableHighlight>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tagBar: {
    flexGrow: 0,
    flexShrink: 0,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tagBarContent: {
    alignItems: 'center',
    paddingRight: 16,
  },
  tagBarItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 4,
  },
  tagBarItemText: {
    fontWeight: '500',
  },
});

export default TagFilterBar;
