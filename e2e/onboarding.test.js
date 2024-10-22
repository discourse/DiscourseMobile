describe('Onboarding', () => {
  beforeAll(async () => {
    await device.launchApp({permissions: {notifications: 'YES'}});
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have onboarding screen', async () => {
    await expect(element(by.text('+ Add your first site'))).toBeVisible();
    await expect(element(by.text('Welcome to Discourse Hub!'))).toBeVisible();
    await element(by.text('+ Add your first site')).tap();
    await expect(element(by.text('Enter the community URL'))).toBeVisible();
    await element(by.text('Back')).tap();
    await expect(element(by.text('Welcome to Discourse Hub!'))).toBeVisible();
  });

  it('should show the Discover screen', async () => {
    await element(by.text('Discover')).tap();
    await expect(element(by.text('all'))).toBeVisible();
  });

  it('should show the Notifications screen', async () => {
    await element(by.text('Notifications')).tap();
    await expect(element(by.text('Replies'))).toBeVisible();
    await element(by.text('Home')).tap();
    await expect(element(by.text('Welcome to Discourse Hub!'))).toBeVisible();
  });

  it('should allow adding a site to the Home list', async () => {
    await element(by.text('+ Add your first site')).tap();
    await expect(element(by.text('Enter the community URL'))).toBeVisible();
    await element(by.id('search-add-input')).typeText('meta.discourse.org');
    await element(by.id('search-add-input')).tapReturnKey();

    await element(by.id('add-site-icon')).tap();
    await expect(element(by.text('Home'))).toBeVisible();
    await expect(element(by.text('Discourse Meta'))).toBeVisible();
    await expect(element(by.text('connect'))).toBeVisible();
    await expect(
      element(by.text('Welcome to Discourse Hub!')),
    ).not.toBeVisible();
  });
});
