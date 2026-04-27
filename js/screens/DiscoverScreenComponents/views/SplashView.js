/* @flow */
'use strict';

import React from 'react';
import { View } from 'react-native';

import TagSplash from '../TagSplash';
import sharedStyles from './styles';

const SplashView = props => {
  const {
    splashTags,
    splashTagsLoading,
    onSelectTag,
    onSelectRecent,
    onSeeAllCommunities,
    renderSearchBox,
  } = props;

  return (
    <View style={sharedStyles.container}>
      {renderSearchBox()}
      <TagSplash
        tags={splashTags}
        loading={splashTagsLoading}
        onSelectTag={tag => onSelectTag(tag)}
        onSelectRecent={() => onSelectRecent()}
        onSeeAllCommunities={() => onSeeAllCommunities()}
      />
    </View>
  );
};

export default SplashView;
