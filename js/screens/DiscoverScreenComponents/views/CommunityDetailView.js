/* @flow */
'use strict';

import React from 'react';
import { View } from 'react-native';

import CommunityDetailCard from '../CommunityDetailView';
import DiscoverTopicList from '../DiscoverTopicList';
import TagDetailHeader from '../TagDetailHeader';
import sharedStyles from './styles';

const CommunityDetailView = props => {
  const {
    community,
    activeTag,
    communityTopics,
    communityTopicsLoading,
    inLocalList,
    largerUI,
    tabBarHeight,
    onAddToSidebar,
    onRemoveFromSidebar,
    onPreview,
    onClickTopic,
    onBack,
    onEndReached,
    onRefresh,
    onExploreMore,
    renderSearchBox,
  } = props;

  if (!community) {
    return null;
  }

  const headerComponent = (
    <CommunityDetailCard
      community={community}
      activeTag={activeTag}
      inLocalList={inLocalList}
      onAddToSidebar={url => onAddToSidebar(url)}
      onRemoveFromSidebar={url => onRemoveFromSidebar(url)}
      onPreview={url => onPreview(url)}
    />
  );

  return (
    <View style={sharedStyles.container}>
      {renderSearchBox()}
      <TagDetailHeader title={community.title} onBack={() => onBack()} />
      <DiscoverTopicList
        topics={communityTopics}
        loading={communityTopicsLoading}
        onClickTopic={url => onClickTopic(url)}
        largerUI={largerUI}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        ListHeaderComponent={headerComponent}
        onEndReached={() => onEndReached()}
        onRefresh={() => onRefresh()}
        onExploreMore={() => onExploreMore()}
      />
    </View>
  );
};

export default CommunityDetailView;
