/* @flow */
'use strict';

import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import i18n from 'i18n-js';

import { ThemeContext } from '../../../ThemeContext';
import CommunityCarousel from '../CommunityCarousel';
import DiscoverTopicList from '../DiscoverTopicList';
import TagFilterBar from './TagFilterBar';
import sharedStyles from './styles';

const TagDetailView = props => {
  const theme = useContext(ThemeContext);
  const {
    activeTag,
    tagCommunities,
    tagCommunitiesLoading,
    hotTopics,
    hotTopicsLoading,
    splashTags,
    largerUI,
    tabBarHeight,
    listRef,
    onPressCommunity,
    onSeeAll,
    onClickTopic,
    onEndReached,
    onRefresh,
    onExploreMore,
    onSelectTag,
    renderSearchBox,
  } = props;

  const activeTagLabel = activeTag;

  const headerComponent = (
    <View>
      <Text style={[styles.sectionLabel, { color: theme.graySubtitle }]}>
        {i18n.t('discover_communities_section', { tag: activeTagLabel })}
      </Text>
      <CommunityCarousel
        communities={tagCommunities}
        loading={tagCommunitiesLoading}
        onPressCommunity={community => onPressCommunity(community)}
      />
      <TouchableHighlight
        style={[
          styles.seeAllButton,
          { backgroundColor: theme.blueCallToAction },
        ]}
        underlayColor={theme.blueUnread}
        onPress={() => onSeeAll()}
      >
        <Text
          style={[styles.seeAllButtonText, { color: theme.buttonTextColor }]}
        >
          {i18n.t('discover_see_all_communities')} ›
        </Text>
      </TouchableHighlight>
      <Text style={[styles.sectionLabel, { color: theme.graySubtitle }]}>
        {i18n.t('discover_topics_section', { tag: activeTagLabel })}
      </Text>
    </View>
  );

  return (
    <View style={sharedStyles.container}>
      {renderSearchBox()}
      <TagFilterBar
        activeKey={activeTag}
        splashTags={splashTags}
        largerUI={largerUI}
        onSelect={key => onSelectTag(key)}
      />
      <DiscoverTopicList
        topics={hotTopics}
        loading={hotTopicsLoading}
        onClickTopic={url => onClickTopic(url)}
        largerUI={largerUI}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        listRef={listRef}
        ListHeaderComponent={headerComponent}
        onEndReached={() => onEndReached()}
        onRefresh={() => onRefresh()}
        onExploreMore={() => onExploreMore()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    textTransform: 'uppercase',
  },
  seeAllButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  seeAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TagDetailView;
