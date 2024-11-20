/* @flow */
'use strict';

import React, {useContext, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {ThemeContext} from '../../ThemeContext';
import fetch from './../../../lib/fetch';

const TopicList = props => {
  const theme = useContext(ThemeContext);
  const [loadCompleted, setLoadCompleted] = useState(false);
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);

  const endpoint = '/hot';
  const siteQuery = `${props.site.url}/site.json`;
  const listQuery = `${props.site.url}${endpoint}.json`;
  const numberOfTopics = 10;

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
      <View style={styles.itemsContainer}>
        <FlatList data={topics} renderItem={({item}) => _renderTopic(item)} />
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
          {item.ai_topic_gist && (
            <View>
              <Text style={{...styles.topicGist, color: theme.grayTitle}}>
                {item.ai_topic_gist}
              </Text>
            </View>
          )}
          <View style={styles.metadataFirstRow}>
            {_renderCategory(item.category_id)}
            <View style={{...styles.topicCounts}}>
              <FontAwesome5
                name={'reply'}
                size={13}
                color={theme.grayUI}
                style={{opacity: 0.75}}
              />
              <Text style={{...styles.topicCountsNum, color: theme.grayUI}}>
                {item.posts_count - 1}
              </Text>
              <FontAwesome5
                name={'heart'}
                size={13}
                color={theme.grayUI}
                style={{opacity: 0.75}}
                solid
              />
              <Text
                style={{
                  ...styles.topicCountsNum,
                  color: theme.grayUI,
                }}>
                {item.like_count}
              </Text>
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
        <View style={{...styles.categoryBadge}}>
          <View
            style={{
              ...styles.categoryPill,
              backgroundColor: '#' + category.color,
            }}
          />
          <Text style={{color: theme.grayTitle}}>{category.name}</Text>
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
  },
  placeholder: {
    minHeight: 480,
    padding: 12,
    flex: 1,
  },
  placeholderHeading: {
    height: 40,
    opacity: 0.3,
    marginVertical: 20,
  },
  placeholderMetadata: {
    height: 16,
    opacity: 0.2,
    marginBottom: 20,
  },
  itemsContainer: {
    flex: 1,
  },
  topicTitle: {
    paddingRight: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  topicGist: {
    fontSize: 14,
    paddingTop: 6,
    paddingBottom: 6,
  },
  topicRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 0,
    paddingBottom: 15,
    marginBottom: 15,
    paddingRight: 20,
    marginLeft: 30,
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
