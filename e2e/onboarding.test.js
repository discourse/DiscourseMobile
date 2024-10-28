/* eslint-disable no-undef */
import i18n from 'i18n-js';

describe.each([['en'], ['fr']])(`Onboarding (locale: %s)`, locale => {
  beforeAll(async () => {
    i18n.translations = {
      en: require('../js/locale/en.json'),
      fr: require('../js/locale/fr.json'),
    };

    i18n.locale = locale;
    i18n.fallbacks = true;

    await device.launchApp({
      newInstance: true,
      languageAndLocale: {
        language: locale,
        locale,
      },
      permissions: {notifications: 'YES'},
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have onboarding screen', async () => {
    await expect(element(by.text(i18n.t('add_first_site')))).toBeVisible();
    await expect(element(by.text(i18n.t('no_sites_yet')))).toBeVisible();
    await element(by.text(i18n.t('add_first_site'))).tap();
    await expect(
      element(by.text(i18n.t('term_placeholder_single_site'))),
    ).toBeVisible();
    await element(by.text(i18n.t('back'))).tap();
    await expect(element(by.text(i18n.t('no_sites_yet')))).toBeVisible();
  });

  it('should show the Discover screen', async () => {
    await element(by.text(i18n.t('discover'))).tap();
    await expect(element(by.text(i18n.t('all')))).toBeVisible();
  });

  it('should show the Notifications screen', async () => {
    await element(by.text(i18n.t('notifications'))).tap();
    await expect(element(by.text(i18n.t('replies')))).toBeVisible();
    await element(by.text(i18n.t('home'))).tap();
    await expect(element(by.text(i18n.t('no_sites_yet')))).toBeVisible();
  });

  it('should allow adding a site to the Home list', async () => {
    await element(by.text(i18n.t('add_first_site'))).tap();
    await expect(element(by.text(i18n.t('no_site_yet')))).toBeVisible();
    await element(by.id('search-add-input')).typeText('meta.discourse.org');
    await element(by.id('search-add-input')).tapReturnKey();

    await element(by.id('add-site-icon')).tap();
    await expect(element(by.text(i18n.t('home')))).toBeVisible();
    await expect(element(by.text('Discourse Meta'))).toBeVisible();
    await expect(element(by.text(i18n.t('connect')))).toBeVisible();
    await expect(element(by.text(i18n.t('no_sites_yet')))).not.toBeVisible();
  });
});
