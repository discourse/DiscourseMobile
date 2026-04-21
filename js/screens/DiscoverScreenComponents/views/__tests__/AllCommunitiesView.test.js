/* @flow */
'use strict';

import React from 'react';
import TestRenderer from 'react-test-renderer';
import { ActivityIndicator, FlatList } from 'react-native';

import { ThemeContext, themes } from '../../../../ThemeContext';
import AllCommunitiesView from '../AllCommunitiesView';

jest.mock('i18n-js', () => ({ t: key => key }));

jest.mock('../TagFilterBar', () => {
  const MockTagFilterBar = () => null;
  return { __esModule: true, default: MockTagFilterBar };
});

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
  allCommunities: [],
  allCommunitiesLoading: false,
  communitiesFilter: null,
  splashTags: [],
  largerUI: false,
  selectionCount: 0,
  tabBarHeight: 0,
  onSelectFilter: () => {},
  renderSearchBox: () => null,
  renderSiteItem: () => null,
};

describe('AllCommunitiesView', () => {
  it('renders an ActivityIndicator in the empty state while loading', async () => {
    const tree = await renderWithTheme(
      <AllCommunitiesView {...baseProps} allCommunitiesLoading={true} />,
    );
    const list = tree.root.findByType(FlatList);

    // ListEmptyComponent is an element, render it into the tree to inspect.
    let emptyTree;
    await TestRenderer.act(async () => {
      emptyTree = TestRenderer.create(list.props.ListEmptyComponent);
    });
    expect(emptyTree.root.findAllByType(ActivityIndicator).length).toBe(1);
  });

  it('does not render an ActivityIndicator when not loading', async () => {
    const tree = await renderWithTheme(
      <AllCommunitiesView {...baseProps} allCommunitiesLoading={false} />,
    );
    const list = tree.root.findByType(FlatList);
    expect(list.props.ListEmptyComponent).toBeNull();
  });

  it('passes communitiesFilter through to TagFilterBar as activeKey', async () => {
    const tree = await renderWithTheme(
      <AllCommunitiesView {...baseProps} communitiesFilter="recent" />,
    );
    const filterBar = tree.root.findByType(MockTagFilterBar);
    expect(filterBar.props.activeKey).toBe('recent');
  });
});
