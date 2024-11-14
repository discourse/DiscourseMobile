/* @flow */
'use strict';

import React, {useContext, useState} from 'react';
import {StyleSheet, Text, TouchableHighlight, View} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {ThemeContext} from '../../ThemeContext';
import {FlashList} from '@shopify/flash-list';
import fetch from './../../../lib/fetch';

const TopicList = props => {
  const theme = useContext(ThemeContext);
  const [loadCompleted, setLoadCompleted] = useState(false);
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);

  const endpoint = '/hot';
  const siteQuery = `${props.site.url}/site.json`;
  const listQuery = `${props.site.url}${endpoint}.json`;
  const numberOfTopics = 20;

  if (!loadCompleted) {
    fetch(siteQuery)
      .then(res => res.json())
      .then(siteJson => {
        if (siteJson.categories) {
          setCategories(siteJson.categories);
        }
        fetch(listQuery)
          .then(res => res.json())
          .then(json => {
            const jsonTopics = json.topic_list.topics;
            if (jsonTopics) {
              setTopics(
                jsonTopics
                  .filter(o => o.pinned === false)
                  .slice(0, numberOfTopics),
              );
            }
            setLoadCompleted(true);
          })
          .catch(e => {
            console.log(e);
            setLoadCompleted(true);
          });
      })
      .catch(e => {
        console.log(e);
      });
  }

  function _renderItems() {
    return (
      <View style={{flex: 1, minHeight: 300}}>
        <FlashList
          estimatedItemSize={10}
          data={topics}
          renderItem={({item}) => _renderTopic(item)}
        />
      </View>
    );
  }

  function _renderPlaceholder() {
    return (
      <View style={styles.placeholder}>
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
    );
  }

  function _renderTopic(item) {
    return (
      <TouchableHighlight
        onPress={() => _openTopic(item)}
        underlayColor={theme.grayBackground}>
        <View style={{...styles.topicRow, borderBottomColor: theme.grayBorder}}>
          <View>
            <Text style={{...styles.topicTitle, color: theme.grayTitle}}>
              {item.unicode_title || item.title}
            </Text>
          </View>
          <View style={styles.metadataFirstRow}>
            {_renderCategory(item.category_id)}
            <View style={{...styles.topicCounts}}>
              <Text
                style={{color: theme.grayUI, fontSize: 15, paddingRight: 5}}>
                {item.posts_count - 1}
              </Text>
              <FontAwesome5 name={'reply'} size={14} color={theme.grayUI} />
            </View>
          </View>
        </View>
      </TouchableHighlight>
    );
  }

  function _renderCategory(categoryId) {
    const category = categories.find(o => o.id === categoryId);
    if (category) {
      return (
        <View style={styles.categoryBadge}>
          <View
            style={{
              ...styles.categoryPill,
              backgroundColor: '#' + category.color,
            }}
          />
          <Text>{category.name}</Text>
        </View>
      );
    }
    return <Text />;
  }

  function _openTopic(item) {
    const topicUrl = `/t/${item.slug}/${item.id}`;
    props.onClickTopic(topicUrl);
  }

  return (
    <View style={{...styles.container, borderBottomColor: theme.grayBorder}}>
      {loadCompleted ? _renderItems() : _renderPlaceholder()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 300,
    overflow: 'scroll',
  },
  placeholder: {
    padding: 12,
    flex: 1,
    minHeight: 300,
  },
  placeholderHeading: {
    height: 40,
    opacity: 0.3,
    marginVertical: 12,
  },
  placeholderMetadata: {
    height: 16,
    opacity: 0.2,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
  },
  topicTitle: {
    paddingRight: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  topicRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  metadataFirstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  topicCounts: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingRight: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    opacity: 0.8,
  },
  categoryPill: {
    height: 9,
    width: 9,
    marginRight: 4,
  },
});

export default TopicList;
