/* @flow */
'use strict';

import React, { useContext } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { ThemeContext } from '../../../ThemeContext';
import TagFilterBar from './TagFilterBar';
import sharedStyles from './styles';

const AllCommunitiesView = props => {
  const theme = useContext(ThemeContext);
  const {
    allCommunities,
    allCommunitiesLoading,
    communitiesFilter,
    splashTags,
    largerUI,
    selectionCount,
    tabBarHeight,
    onSelectFilter,
    renderSearchBox,
    renderSiteItem,
  } = props;

  const emptyComponent = allCommunitiesLoading ? (
    <View style={sharedStyles.emptyResult}>
      <ActivityIndicator size="large" color={theme.grayUI} />
    </View>
  ) : null;

  return (
    <View style={sharedStyles.container}>
      {renderSearchBox()}
      <TagFilterBar
        activeKey={communitiesFilter}
        splashTags={splashTags}
        largerUI={largerUI}
        onSelect={key => onSelectFilter(key)}
      />
      <FlatList
        keyExtractor={item => String(item.id || item.featured_link)}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={{ paddingBottom: tabBarHeight }}
        data={allCommunities}
        renderItem={({ item }) => renderSiteItem({ item })}
        extraData={selectionCount}
        keyboardDismissMode="on-drag"
      />
    </View>
  );
};

export default AllCommunitiesView;
