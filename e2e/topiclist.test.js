/*global describe*/
/*global beforeAll*/
/*global beforeEach*/
/*global it*/

import i18n from 'i18n-js';

import { by, device, element, expect } from 'detox';

describe('Topic list', () => {
  beforeAll(async () => {
    i18n.translations = {
      en: require('../js/locale/en.json'),
    };

    i18n.locale = 'en';

    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show topic list when invoking Hot topics', async () => {
    await element(by.id('nav-plus-icon')).tap();
    await element(by.id('search-add-input')).typeText('meta.discourse.org');
    await element(by.id('search-add-input')).tapReturnKey();
    await element(by.id('add-site-icon')).tap();

    await expect(element(by.text('Discourse Meta'))).toBeVisible();

    await element(by.id('nav-plus-icon')).tap();
    await element(by.id('search-add-input')).typeText('forums.swift.org');
    await element(by.id('search-add-input')).tapReturnKey();
    await element(by.id('add-site-icon')).tap();

    await expect(element(by.text('Swift Forums'))).toBeVisible();

    await expect(element(by.text(i18n.t('home')))).toBeVisible();
    await element(by.text(i18n.t('hot_topics'))).tap();
    await expect(element(by.id('topic-list'))).toExist();
  });
});
