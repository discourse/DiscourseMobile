/* @flow */
'use strict';

import React, { useContext } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { ThemeContext } from '../../ThemeContext';
import i18n from 'i18n-js';

// Primary tags always appear at the top of the splash in this order.
// `tag` is the underlying tag filter; `label` is what the user sees.
export const PRIMARY_TAGS = [
  { tag: 'ai', label: 'ai' },
  { tag: 'technology', label: 'tech' },
  { tag: 'interests', label: 'interests' },
  { tag: 'support', label: 'support' },
  { tag: 'media', label: 'media' },
  { tag: 'gaming', label: 'gaming' },
  { tag: 'finance', label: 'finance' },
  { tag: 'open-source', label: 'open-source' },
];

const TagSplash = props => {
  const theme = useContext(ThemeContext);

  if (props.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.grayUI} />
      </View>
    );
  }

  const primaryTagSet = new Set(PRIMARY_TAGS.map(t => t.tag));
  const secondaryTags = (props.tags || [])
    .filter(tag => !primaryTagSet.has(tag))
    .sort((a, b) => a.localeCompare(b));

  const renderTagButton = ({
    key,
    label,
    onPress,
    accessibilityLabel,
    secondary,
  }) => (
    <TouchableHighlight
      key={key}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={{
        ...(secondary ? styles.secondaryTagButton : styles.tagButton),
        borderColor: theme.grayUILight,
        backgroundColor: theme.grayBackground,
      }}
      underlayColor={theme.yellowUIFeedback}
      onPress={onPress}
    >
      <Text
        style={{
          ...(secondary ? styles.secondaryTagLabel : styles.tagLabel),
          color: theme.tagButtonTextColor,
        }}
      >
        {label}
      </Text>
    </TouchableHighlight>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={{ ...styles.prompt, color: theme.grayTitle }}>
          {i18n.t('discover_pick_tag')}
        </Text>
        <Text style={{ ...styles.promptDescription, color: theme.grayTitle }}>
          {i18n.t('discover_pick_tag_description')}
        </Text>
      </View>

      <View style={styles.tagGrid}>
        {PRIMARY_TAGS.map(({ tag, label }) =>
          renderTagButton({
            key: tag,
            label,
            accessibilityLabel: tag,
            onPress: () => props.onSelectTag(tag),
          }),
        )}
        {renderTagButton({
          key: '__recent__',
          label: i18n.t('discover_recent'),
          onPress: () => props.onSelectRecent(),
        })}
      </View>

      {secondaryTags.length > 0 && (
        <View
          style={[styles.secondaryGrid, { borderColor: theme.grayUILight }]}
        >
          {secondaryTags.map(tag =>
            renderTagButton({
              key: tag,
              label: tag,
              onPress: () => props.onSelectTag(tag),
              secondary: true,
            }),
          )}
        </View>
      )}

      <TouchableHighlight
        accessibilityRole="button"
        style={{
          ...styles.directoryButton,
          backgroundColor: theme.blueCallToAction,
        }}
        underlayColor={theme.blueUnread}
        onPress={props.onSeeAllCommunities}
      >
        <Text
          style={{
            ...styles.directoryButtonText,
            color: theme.buttonTextColor,
          }}
        >
          {i18n.t('discover_community_directory')} ›
        </Text>
      </TouchableHighlight>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 10 : 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? 4 : 10,
  },
  prompt: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Platform.OS === 'android' ? 4 : 16,
  },
  promptDescription: {
    fontSize: 16,
    marginTop: Platform.OS === 'android' ? 4 : 10,
    textAlign: 'center',
    padding: Platform.OS === 'android' ? 4 : 10,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 15,
    paddingBottom: 15,
    marginBottom: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tagButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    margin: 6,
  },
  secondaryTagButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    margin: 4,
  },
  tagLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryTagLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  directoryButton: {
    alignSelf: 'stretch',
    marginHorizontal: 10,
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  directoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TagSplash;
