/* @flow */
'use strict';

import React, { useContext } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import { ThemeContext } from '../../ThemeContext';
import i18n from 'i18n-js';

const DiscoverTopicList = props => {
  const theme = useContext(ThemeContext);

  function _renderTopic({ item }) {
    return (
      <TouchableHighlight
        onPress={() => props.onClickTopic(item.url)}
        underlayColor={theme.background}
        activeOpacity={0.6}
        style={{
          ...styles.topicRow,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.grayBorder,
        }}
      >
        <View>
          <View>
            <Text style={{ ...styles.topicTitle, color: theme.grayTitle }}>
              {item.title}
            </Text>
          </View>
          {item.excerpt ? (
            <View>
              <Text
                style={{ ...styles.topicExcerpt, color: theme.grayTitle }}
                numberOfLines={2}
              >
                {item.excerpt}
              </Text>
            </View>
          ) : null}
          <View style={styles.metadataFirstRow}>
            {_renderCommunity(item)}
            <View style={styles.topicCounts}>
              <FontAwesome5
                name={'reply'}
                size={13}
                color={theme.grayUI}
                style={{ opacity: 0.75 }}
                iconStyle="solid"
              />
              <Text style={{ ...styles.topicCountsNum, color: theme.grayUI }}>
                {item.reply_count}
              </Text>
              <FontAwesome5
                name={'heart'}
                size={13}
                color={theme.grayUI}
                style={{ opacity: 0.75 }}
                iconStyle="solid"
              />
              <Text style={{ ...styles.topicCountsNum, color: theme.grayUI }}>
                {item.like_count}
              </Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    );
  }

  function _renderCommunity(item) {
    if (!item.community_name) {
      return <Text />;
    }

    return (
      <View style={styles.communityBadge}>
        {item.community_logo_url ? (
          <Image
            source={{ uri: item.community_logo_url }}
            style={styles.communityLogo}
          />
        ) : null}
        <Text
          style={{ ...styles.communityName, color: theme.grayTitle }}
          numberOfLines={1}
        >
          {item.community_name}
        </Text>
      </View>
    );
  }

  function _renderPlaceholder() {
    return (
      <View style={styles.placeholder}>
        {[0, 1, 2, 3].map(i => (
          <View key={i}>
            <View
              style={{
                ...styles.placeholderHeading,
                backgroundColor: theme.grayUILight,
              }}
            />
            <View
              style={{
                ...styles.placeholderMetadata,
                backgroundColor: theme.grayUILight,
              }}
            />
          </View>
        ))}
      </View>
    );
  }

  function _renderEmpty() {
    return (
      <View>
        <Text style={{ ...styles.emptyText, color: theme.grayTitle }}>
          {i18n.t('no_hot_topics')}
        </Text>
      </View>
    );
  }

  function _renderFooter() {
    if (props.loading || props.topics.length === 0) {
      return null;
    }

    return (
      <TouchableHighlight
        style={styles.footer}
        underlayColor={theme.grayBackground}
        onPress={props.onExploreMore}
      >
        <View style={styles.footerContent}>
          <FontAwesome5
            name={'compass'}
            size={18}
            color={theme.blueCallToAction}
            iconStyle="solid"
            style={{ marginRight: 8 }}
          />
          <Text style={{ ...styles.footerText, color: theme.blueCallToAction }}>
            {i18n.t('discover_explore_more')}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }

  if (props.loading && props.topics.length === 0) {
    return _renderPlaceholder();
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={props.listRef}
        data={props.topics}
        keyExtractor={item => String(item.id)}
        renderItem={_renderTopic}
        ListHeaderComponent={props.ListHeaderComponent}
        ListEmptyComponent={_renderEmpty}
        ListFooterComponent={_renderFooter}
        onEndReached={props.onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={props.contentContainerStyle}
        refreshing={props.loading}
        onRefresh={props.onRefresh}
        onScroll={props.onScroll}
        scrollEventThrottle={16}
        keyboardDismissMode="on-drag"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholder: {
    minHeight: 560,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  placeholderHeading: {
    height: 40,
    opacity: 0.3,
    marginBottom: 20,
  },
  placeholderMetadata: {
    height: 16,
    opacity: 0.2,
    marginBottom: 20,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  topicExcerpt: {
    fontSize: 14,
    paddingTop: 6,
    paddingBottom: 6,
  },
  topicRow: {
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  metadataFirstRow: {
    flexDirection: 'row',
    paddingTop: 6,
  },
  topicCounts: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 10,
  },
  topicCountsNum: {
    fontSize: 14,
    paddingRight: 8,
    paddingLeft: 4,
  },
  communityBadge: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    opacity: 0.8,
    flexShrink: 1,
  },
  communityLogo: {
    height: 16,
    width: 16,
    marginRight: 6,
    borderRadius: 3,
  },
  communityName: {
    fontSize: 13,
  },
  emptyText: {
    padding: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DiscoverTopicList;
