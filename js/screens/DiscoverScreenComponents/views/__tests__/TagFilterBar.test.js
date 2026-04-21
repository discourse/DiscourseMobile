/* @flow */
'use strict';

import React from 'react';
import TestRenderer from 'react-test-renderer';
import { TouchableHighlight } from 'react-native';

import { ThemeContext, themes } from '../../../../ThemeContext';
import TagFilterBar from '../TagFilterBar';
import { PRIMARY_TAGS } from '../../TagSplash';

jest.mock('i18n-js', () => ({
  t: key => key,
}));

const renderWithTheme = async ui => {
  let tree;
  await TestRenderer.act(async () => {
    tree = TestRenderer.create(
      <ThemeContext.Provider value={themes.light}>{ui}</ThemeContext.Provider>,
    );
  });
  return tree;
};

describe('TagFilterBar', () => {
  it('builds entries from PRIMARY_TAGS + splashTags, dedupes primary and sorts secondary', async () => {
    const primarySample = PRIMARY_TAGS[0].tag;
    const splashTags = [primarySample, 'zebra', 'cats'];

    const tree = await renderWithTheme(
      <TagFilterBar
        activeKey={null}
        splashTags={splashTags}
        largerUI={false}
        onSelect={() => {}}
      />,
    );

    const buttons = tree.root.findAllByType(TouchableHighlight);

    // "All" + all PRIMARY_TAGS + "recent" + 2 deduped secondary tags
    expect(buttons.length).toBe(1 + PRIMARY_TAGS.length + 1 + 2);

    const labels = buttons.map(b => b.props.accessibilityLabel);
    expect(labels[0]).toBe('discover_all');
    expect(labels[PRIMARY_TAGS.length + 1]).toBe('discover_recent');

    const secondaryLabels = labels.slice(PRIMARY_TAGS.length + 2);
    expect(secondaryLabels).toEqual(['cats', 'zebra']);
  });

  it('invokes onSelect with the entry key when a tag is pressed', async () => {
    const onSelect = jest.fn();

    const tree = await renderWithTheme(
      <TagFilterBar
        activeKey={null}
        splashTags={['zebra']}
        largerUI={false}
        onSelect={onSelect}
      />,
    );

    const zebraButton = tree.root
      .findAllByType(TouchableHighlight)
      .find(b => b.props.accessibilityLabel === 'zebra');

    expect(zebraButton).toBeDefined();
    await TestRenderer.act(async () => {
      zebraButton.props.onPress();
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('zebra');
  });
});
