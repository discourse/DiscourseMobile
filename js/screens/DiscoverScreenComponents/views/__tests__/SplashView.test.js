/* @flow */
'use strict';

import React from 'react';
import TestRenderer from 'react-test-renderer';

import { ThemeContext, themes } from '../../../../ThemeContext';
import SplashView from '../SplashView';

jest.mock('i18n-js', () => ({ t: key => key }));

jest.mock('../../TagSplash', () => {
  const MockTagSplash = () => null;
  return { __esModule: true, default: MockTagSplash };
});

const MockTagSplash = require('../../TagSplash').default;

const renderWithTheme = async ui => {
  let tree;
  await TestRenderer.act(async () => {
    tree = TestRenderer.create(
      <ThemeContext.Provider value={themes.light}>{ui}</ThemeContext.Provider>,
    );
  });
  return tree;
};

describe('SplashView', () => {
  it('renders the search box and forwards tag props to TagSplash', async () => {
    const renderSearchBox = jest.fn(() => null);
    const onSelectTag = jest.fn();
    const tags = ['ai', 'finance'];

    const tree = await renderWithTheme(
      <SplashView
        splashTags={tags}
        splashTagsLoading={false}
        onSelectTag={onSelectTag}
        onSelectRecent={() => {}}
        onSeeAllCommunities={() => {}}
        renderSearchBox={renderSearchBox}
      />,
    );

    expect(renderSearchBox).toHaveBeenCalled();

    const tagSplash = tree.root.findByType(MockTagSplash);
    expect(tagSplash.props.tags).toBe(tags);
    expect(tagSplash.props.loading).toBe(false);
  });

  it('forwards TagSplash callbacks to the corresponding props', async () => {
    const onSelectTag = jest.fn();
    const onSelectRecent = jest.fn();
    const onSeeAllCommunities = jest.fn();

    const tree = await renderWithTheme(
      <SplashView
        splashTags={[]}
        splashTagsLoading={true}
        onSelectTag={onSelectTag}
        onSelectRecent={onSelectRecent}
        onSeeAllCommunities={onSeeAllCommunities}
        renderSearchBox={() => null}
      />,
    );

    const tagSplash = tree.root.findByType(MockTagSplash);
    tagSplash.props.onSelectTag('ai');
    tagSplash.props.onSelectRecent();
    tagSplash.props.onSeeAllCommunities();

    expect(onSelectTag).toHaveBeenCalledWith('ai');
    expect(onSelectRecent).toHaveBeenCalledTimes(1);
    expect(onSeeAllCommunities).toHaveBeenCalledTimes(1);
  });
});
