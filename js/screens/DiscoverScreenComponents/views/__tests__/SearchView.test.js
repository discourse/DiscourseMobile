/* @flow */
'use strict';

import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Text, TouchableHighlight } from 'react-native';

import { ThemeContext, themes } from '../../../../ThemeContext';
import SearchView from '../SearchView';

jest.mock('i18n-js', () => ({ t: key => key }));

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
  term: 'react',
  results: [],
  loading: false,
  selectionCount: 0,
  tabBarHeight: 0,
  listRef: () => {},
  onResetToSplash: () => {},
  onRefresh: () => {},
  onEndReached: () => {},
  renderSearchBox: () => null,
  renderSiteItem: () => null,
};

describe('SearchView', () => {
  it('shows the single-character empty message when term is 1 char long', async () => {
    const tree = await renderWithTheme(<SearchView {...baseProps} term="a" />);
    const textNodes = tree.root
      .findAllByType(Text)
      .map(n => n.props.children)
      .flat();
    expect(textNodes).toContain('discover_no_results_one_character');
    expect(textNodes).not.toContain('discover_no_results');
  });

  it('calls onResetToSplash when the reset button is pressed', async () => {
    const onResetToSplash = jest.fn();
    const tree = await renderWithTheme(
      <SearchView {...baseProps} onResetToSplash={onResetToSplash} />,
    );

    const resetButton = tree.root.findByType(TouchableHighlight);
    const label = resetButton.findByType(Text).props.children;
    expect(label).toBe('discover_reset');

    await TestRenderer.act(async () => {
      resetButton.props.onPress();
    });
    expect(onResetToSplash).toHaveBeenCalledTimes(1);
  });
});
