import i18n from 'i18n-js';

import {by, device, element, expect} from 'detox';

describe('Test suite 1', () => {
  beforeAll(async () => {
    i18n.translations = {
      en: require('../js/locale/en.json'),
    };

    i18n.locale = 'en';

    await device.launchApp({
      newInstance: true,
      permissions: {notifications: 'YES'},
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show topic list on tablets', async () => {
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

    if (device.name.includes('iPad')) {
      await expect(element(by.text(i18n.t('home')))).toBeVisible();
      await element(by.id('topic-list-toggle')).tap();
      await expect(element(by.id('topic-list'))).toExist();
    } else {
      await expect(element(by.id('topic-list-toggle'))).not.toExist();
    }
  });
});
