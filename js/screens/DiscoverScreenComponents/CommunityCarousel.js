/* @flow */
'use strict';

import React, { useContext } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  useWindowDimensions,
  View,
} from 'react-native';
import { ThemeContext } from '../../ThemeContext';
import SiteLogo, { isValidLogoUrl } from '../CommonComponents/SiteLogo';

const HORIZONTAL_PADDING = 16;
const COLUMN_GAP = 12;
const ROW_GAP = 10;
const VISIBLE_COLUMNS = 3.35;
const VISIBLE_GAPS = Math.ceil(VISIBLE_COLUMNS) - 1;

function buildColumns(items) {
  const columns = [];

  for (let index = 0; index < items.length; index += 2) {
    columns.push(items.slice(index, index + 2));
  }

  return columns;
}

const CommunityCarousel = props => {
  const theme = useContext(ThemeContext);
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.max(
    96,
    Math.floor(
      (windowWidth - HORIZONTAL_PADDING * 2 - COLUMN_GAP * VISIBLE_GAPS) /
        VISIBLE_COLUMNS,
    ),
  );
  const columns = buildColumns(props.communities || []);

  if (props.loading) {
    return (
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {[0, 1, 2, 3].map(columnIndex => (
          <View
            key={columnIndex}
            style={[
              styles.column,
              {
                width: cardWidth,
                marginRight: columnIndex === 3 ? 0 : COLUMN_GAP,
              },
            ]}
          >
            {[0, 1].map(rowIndex => (
              <View
                key={rowIndex}
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    marginBottom: rowIndex === 0 ? ROW_GAP : 0,
                  },
                ]}
              >
                <View style={styles.cardContent}>
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
              </View>
            ))}
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
      decelerationRate="fast"
      snapToInterval={cardWidth + COLUMN_GAP}
      snapToAlignment="start"
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      {columns.map((column, columnIndex) => (
        <View
          key={`column-${columnIndex}`}
          style={[
            styles.column,
            {
              width: cardWidth,
              marginRight: columnIndex === columns.length - 1 ? 0 : COLUMN_GAP,
            },
          ]}
        >
          {column.map((community, rowIndex) => {
            const iconUrl = community.discover_entry_logo_url;
            const logoImage = isValidLogoUrl(iconUrl)
              ? { uri: iconUrl }
              : false;

            return (
              <TouchableHighlight
                key={community.featured_link || community.title}
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    marginBottom: rowIndex === 0 ? ROW_GAP : 0,
                  },
                ]}
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
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    paddingVertical: 8,
  },
  contentContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  column: {
    justifyContent: 'flex-start',
  },
  card: {
    borderRadius: 10,
    paddingVertical: 8,
  },
  cardContent: {
    alignItems: 'center',
    minHeight: 86,
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
    width: '100%',
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
