/* @flow */
'use strict';

import React, { useContext } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { ThemeContext } from '../../ThemeContext';
import SiteLogo, { isValidLogoUrl } from '../CommonComponents/SiteLogo';

const CommunityCarousel = props => {
  const theme = useContext(ThemeContext);

  if (props.loading) {
    return (
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={styles.card}>
            <View
              style={[
                styles.placeholderLogo,
                { backgroundColor: theme.grayUILight },
              ]}
            />
            <View
              style={[
                styles.placeholderText,
                { backgroundColor: theme.grayUILight },
              ]}
            />
          </View>
        ))}
      </ScrollView>
    );
  }

  if (!props.communities || props.communities.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
    >
      {props.communities.map(community => {
        const iconUrl = community.discover_entry_logo_url;
        const logoImage = isValidLogoUrl(iconUrl) ? { uri: iconUrl } : false;

        return (
          <TouchableHighlight
            key={community.featured_link || community.title}
            style={styles.card}
            underlayColor={theme.grayBackground}
            onPress={() => props.onPressCommunity(community)}
            accessibilityRole="button"
            accessibilityLabel={community.title}
          >
            <View style={styles.cardContent}>
              <View style={styles.logoContainer}>
                <SiteLogo logoImage={logoImage} title={community.title} />
              </View>
              <Text
                style={[styles.cardTitle, { color: theme.grayTitle }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {community.title}
              </Text>
            </View>
          </TouchableHighlight>
        );
      })}
      <View style={{ width: 16 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    paddingLeft: 16,
    paddingVertical: 8,
  },
  card: {
    width: 100,
    marginRight: 12,
    borderRadius: 10,
    paddingVertical: 8,
  },
  cardContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  placeholderLogo: {
    height: 42,
    width: 42,
    borderRadius: 10,
    opacity: 0.3,
  },
  placeholderText: {
    height: 12,
    width: 60,
    borderRadius: 4,
    marginTop: 8,
    opacity: 0.2,
  },
});

export default CommunityCarousel;
