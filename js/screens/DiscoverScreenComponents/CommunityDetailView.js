/* @flow */
'use strict';

import React, { useContext } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import { ThemeContext } from '../../ThemeContext';
import i18n from 'i18n-js';

function hashCode(str) {
  let hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

const CommunityDetailView = props => {
  const theme = useContext(ThemeContext);

  const { community, topicsCount, inLocalList } = props;
  const iconUrl = community.discover_entry_logo_url;
  const hasLogo =
    iconUrl && !iconUrl.endsWith('.webp') && !iconUrl.endsWith('.svg');

  const link = community.featured_link || '';
  const displayLink = link.replace(/^https?:\/\//, '');

  const addButtonColor = inLocalList ? theme.redDanger : theme.blueCallToAction;
  const addButtonText = inLocalList
    ? i18n.t('remove_from_home_screen')
    : i18n.t('add_to_home_screen');
  const addButtonIcon = inLocalList ? 'minus' : 'plus';

  function pickColor(str, text = false) {
    const darkMode = theme.name === 'dark';
    let s = darkMode ? 30 : 50;
    let l = darkMode ? 20 : 60;
    if (text) {
      s = s + 20;
      l = l + 30;
    }
    return `hsl(${hashCode(str) % 360}, ${s}%, ${l}%)`;
  }

  function renderLogo() {
    if (hasLogo) {
      return (
        <Image
          style={styles.logo}
          source={{ uri: iconUrl }}
          resizeMode="contain"
        />
      );
    }

    return (
      <View
        style={[styles.logo, { backgroundColor: pickColor(community.title) }]}
      >
        <Text
          style={[
            styles.logoInitial,
            { color: pickColor(community.title, true) },
          ]}
        >
          {community.title[0]}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        {renderLogo()}
        <Text
          style={[styles.communityLink, { color: theme.graySubtitle }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayLink}
        </Text>

        <View style={styles.statsRow}>
          {community.active_users_30_days ? (
            <View style={styles.statItem}>
              <FontAwesome5
                name="users"
                size={13}
                color={theme.grayUI}
                iconStyle="solid"
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.statText, { color: theme.graySubtitle }]}>
                {i18n.t('active_counts', {
                  active_users: i18n.toNumber(community.active_users_30_days, {
                    precision: 0,
                  }),
                })}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.buttonsSection}>
        <TouchableHighlight
          style={[styles.actionButton, { backgroundColor: addButtonColor }]}
          underlayColor={addButtonColor}
          onPress={() =>
            inLocalList
              ? props.onRemoveFromSidebar(link)
              : props.onAddToSidebar(link)
          }
          accessibilityRole="button"
          accessibilityLabel={addButtonText}
        >
          <View style={styles.buttonContent}>
            <FontAwesome5
              name={addButtonIcon}
              size={14}
              color={theme.buttonTextColor}
              iconStyle="solid"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.buttonText, { color: theme.buttonTextColor }]}>
              {addButtonText}
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          style={[
            styles.actionButton,
            styles.secondaryButton,
            {
              backgroundColor: theme.background,
              borderColor: theme.blueCallToAction,
            },
          ]}
          underlayColor={theme.grayBackground}
          onPress={() => props.onPreview(link)}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('preview')}
        >
          <View style={styles.buttonContent}>
            <FontAwesome5
              name="external-link-alt"
              size={14}
              color={theme.blueCallToAction}
              iconStyle="solid"
              style={{ marginRight: 8 }}
            />
            <Text
              style={[styles.buttonText, { color: theme.blueCallToAction }]}
            >
              {i18n.t('preview')}
            </Text>
          </View>
        </TouchableHighlight>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.graySubtitle }]}>
        {i18n.t('community_recent_topics')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 4,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: 48,
    fontWeight: '700',
  },
  communityLink: {
    fontSize: 14,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
  },
  buttonsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    textTransform: 'uppercase',
  },
});

export default CommunityDetailView;
