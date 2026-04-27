/* @flow */
'use strict';

import React from 'react';
import TestRenderer from 'react-test-renderer';

import { ThemeContext, themes } from '../../../../ThemeContext';
import CommunityDetailView from '../CommunityDetailView';

jest.mock('i18n-js', () => ({ t: key => key }));

jest.mock('../../CommunityDetailView', () => {
  const MockCommunityDetailCard = () => null;
  return { __esModule: true, default: MockCommunityDetailCard };
});

jest.mock('../../DiscoverTopicList', () => {
  const MockDiscoverTopicList = props => props.ListHeaderComponent || null;
  return { __esModule: true, default: MockDiscoverTopicList };
});

jest.mock('../../TagDetailHeader', () => {
  const MockTagDetailHeader = () => null;
  return { __esModule: true, default: MockTagDetailHeader };
});

const MockCommunityDetailCard = require('../../CommunityDetailView').default;
const MockDiscoverTopicList = require('../../DiscoverTopicList').default;
const MockTagDetailHeader = require('../../TagDetailHeader').default;

const renderWithTheme = async ui => {
  let tree;
  await TestRenderer.act(async () => {
    tree = TestRenderer.create(
      <ThemeContext.Provider value={themes.light}>{ui}</ThemeContext.Provider>,
    );
  });
  return tree;
};

const community = {
  id: 42,
  title: 'Example',
  featured_link: 'https://example.com',
};

const baseProps = {
  community,
  activeTag: 'ai',
  communityTopics: [],
  communityTopicsLoading: false,
  inLocalList: false,
  largerUI: false,
  tabBarHeight: 0,
  onAddToSidebar: () => {},
  onRemoveFromSidebar: () => {},
  onPreview: () => {},
  onClickTopic: () => {},
  onBack: () => {},
  onEndReached: () => {},
  onRefresh: () => {},
  onExploreMore: () => {},
  renderSearchBox: () => null,
};

describe('CommunityDetailView (screen view)', () => {
  it('returns null when community is not provided', async () => {
    const tree = await renderWithTheme(
      <CommunityDetailView {...baseProps} community={null} />,
    );
    expect(tree.toJSON()).toBeNull();
  });

  it('renders the header with the community title and wires up onBack', async () => {
    const onBack = jest.fn();
    const tree = await renderWithTheme(
      <CommunityDetailView {...baseProps} onBack={onBack} />,
    );

    const header = tree.root.findByType(MockTagDetailHeader);
    expect(header.props.title).toBe('Example');

    header.props.onBack();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('passes community state through to the detail card and topic list', async () => {
    const tree = await renderWithTheme(
      <CommunityDetailView
        {...baseProps}
        communityTopics={[{ id: 1 }]}
        inLocalList={true}
      />,
    );

    const card = tree.root.findByType(MockCommunityDetailCard);
    expect(card.props.community).toBe(community);
    expect(card.props.inLocalList).toBe(true);

    const topicList = tree.root.findByType(MockDiscoverTopicList);
    expect(topicList.props.topics.length).toBe(1);
  });
});
