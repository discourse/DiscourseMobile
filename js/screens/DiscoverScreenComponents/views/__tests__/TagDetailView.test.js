/* @flow */
'use strict';

import React from 'react';
import TestRenderer from 'react-test-renderer';
import { TouchableHighlight } from 'react-native';

import { ThemeContext, themes } from '../../../../ThemeContext';
import TagDetailView from '../TagDetailView';

jest.mock('i18n-js', () => ({
  t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
}));

jest.mock('../../CommunityCarousel', () => {
  const MockCommunityCarousel = () => null;
  return { __esModule: true, default: MockCommunityCarousel };
});

jest.mock('../../DiscoverTopicList', () => {
  const MockDiscoverTopicList = props => props.ListHeaderComponent || null;
  return { __esModule: true, default: MockDiscoverTopicList };
});

jest.mock('../TagFilterBar', () => {
  const MockTagFilterBar = () => null;
  return { __esModule: true, default: MockTagFilterBar };
});

const MockCommunityCarousel = require('../../CommunityCarousel').default;
const MockDiscoverTopicList = require('../../DiscoverTopicList').default;
const MockTagFilterBar = require('../TagFilterBar').default;

const renderWithTheme = async ui => {
  let tree;
  await TestRenderer.act(async () => {
    tree = TestRenderer.create(
      <ThemeContext.Provider value={themes.light}>{ui}</ThemeContext.Provider>,
    );
  });
  return tree;
};

const baseProps = {
  activeTag: 'ai',
  tagCommunities: [{ id: 1 }],
  tagCommunitiesLoading: false,
  hotTopics: [],
  hotTopicsLoading: false,
  splashTags: ['ai', 'finance'],
  largerUI: false,
  tabBarHeight: 0,
  listRef: () => {},
  onPressCommunity: () => {},
  onSeeAll: () => {},
  onClickTopic: () => {},
  onEndReached: () => {},
  onRefresh: () => {},
  onExploreMore: () => {},
  onSelectTag: () => {},
  renderSearchBox: () => null,
};

describe('TagDetailView', () => {
  it('forwards state props to CommunityCarousel, TagFilterBar, and DiscoverTopicList', async () => {
    const tree = await renderWithTheme(<TagDetailView {...baseProps} />);

    const carousel = tree.root.findByType(MockCommunityCarousel);
    expect(carousel.props.communities).toBe(baseProps.tagCommunities);
    expect(carousel.props.loading).toBe(false);

    const filterBar = tree.root.findByType(MockTagFilterBar);
    expect(filterBar.props.activeKey).toBe('ai');
    expect(filterBar.props.splashTags).toBe(baseProps.splashTags);

    const topicList = tree.root.findByType(MockDiscoverTopicList);
    expect(topicList.props.topics).toBe(baseProps.hotTopics);
  });

  it('fires onSeeAll when the "see all communities" button is pressed', async () => {
    const onSeeAll = jest.fn();
    const tree = await renderWithTheme(
      <TagDetailView {...baseProps} onSeeAll={onSeeAll} />,
    );

    // TagFilterBar and CommunityCarousel are mocked and render null, so the
    // only TouchableHighlight in the tree is the "see all communities" button
    // rendered in the DiscoverTopicList's ListHeaderComponent.
    const seeAllButton = tree.root.findByType(TouchableHighlight);

    await TestRenderer.act(async () => {
      seeAllButton.props.onPress();
    });
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });
});
