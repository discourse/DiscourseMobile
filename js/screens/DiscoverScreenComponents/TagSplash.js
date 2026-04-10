/* @flow */
'use strict';

import React, { useContext } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { ThemeContext } from '../../ThemeContext';
import i18n from 'i18n-js';

const TagSplash = props => {
  const theme = useContext(ThemeContext);

  if (props.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.grayUI} />
      </View>
    );
  }

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
      </View>

      <View style={styles.tagGrid}>
        {props.tags.map(tag => (
          <TouchableHighlight
            key={tag}
            accessibilityRole="button"
            accessibilityLabel={tag}
            style={{
              ...styles.tagButton,
              borderColor: theme.grayUILight,
              backgroundColor: theme.background,
            }}
            underlayColor={theme.grayBackground}
            onPress={() => props.onSelectTag(tag)}
          >
            <Text
              style={{ ...styles.tagLabel, color: theme.tagButtonTextColor }}
            >
              {tag}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
