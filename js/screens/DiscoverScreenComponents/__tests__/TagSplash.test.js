/* @flow */
'use strict';

import React from 'react';
import { Dimensions, ScrollView, StyleSheet } from 'react-native';
import TestRenderer from 'react-test-renderer';
import { ThemeContext, themes } from '../../../ThemeContext';
import TagSplash from '../TagSplash';

jest.mock('i18n-js', () => ({ t: key => key }));

it('updates the tag layout as the same screen expands and contracts', async () => {
  const window = Dimensions.get('window');
  const screen = Dimensions.get('screen');
  const resize = width =>
    Dimensions.set({ window: { ...window, width }, screen });
  let tree;

  try {
    await TestRenderer.act(async () => {
      resize(390);
      tree = TestRenderer.create(
        <ThemeContext.Provider value={themes.light}>
          <TagSplash />
        </ThemeContext.Provider>,
      );
    });

    const horizontalPadding = () =>
      StyleSheet.flatten(
        tree.root.findByType(ScrollView).props.contentContainerStyle,
      ).paddingHorizontal;

    expect(horizontalPadding()).toBe(20);
    await TestRenderer.act(async () => resize(740));
    expect(horizontalPadding()).toBe(80);
    await TestRenderer.act(async () => resize(390));
    expect(horizontalPadding()).toBe(20);
  } finally {
    await TestRenderer.act(async () => {
      tree?.unmount();
      Dimensions.set({ window, screen });
    });
  }
});
