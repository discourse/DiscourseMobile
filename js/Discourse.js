/* @flow */
'use strict';

import React from 'react';
import {ThemeContext, themes} from './ThemeContext';
import {
  Alert,
  Appearance,
  AppState,
  Linking,
  Platform,
  NativeModules,
  NativeEventEmitter,
  Settings,
  StatusBar,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import Screens from './screens';
import Site from './site';
import SiteManager from './site_manager';
import SafariView from 'react-native-safari-view';
import SafariWebAuth from 'react-native-safari-web-auth';
import DeviceInfo from 'react-native-device-info';
import firebase from './firebase/helper';
import bgMessaging from './firebase/bgMessaging';
import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootViewBackgroundColor from 'react-native-root-view-background-color';
import {CustomTabs} from 'react-native-custom-tabs';
import i18n from 'i18n-js';
import * as RNLocalize from 'react-native-localize';
import {addShortcutListener} from 'react-native-siri-shortcut';
import {enableScreens} from 'react-native-screens';
import type {Notification, NotificationOpen} from './firebase/helper';

const {DiscourseKeyboardShortcuts} = NativeModules;
const eventEmitter = new NativeEventEmitter(DiscourseKeyboardShortcuts);

// It's not ideal that we have to manually register languages here
// but react-native doesn't make it easy to loop through files in a folder
// there's react-native-fs, but I hesitate to add another dependency just for that
i18n.translations = {
  ar: require('./locale/ar.json'),
  de: require('./locale/de.json'),
  en: require('./locale/en.json'),
  es: require('./locale/es.json'),
  fi: require('./locale/fi.json'),
  fr: require('./locale/fr.json'),
  he: require('./locale/he.json'),
  hu: require('./locale/hu.json'),
  it: require('./locale/it.json'),
  ja: require('./locale/ja.json'),
  nl: require('./locale/nl.json'),
  'pt-BR': require('./locale/pt_BR.json'),
  ru: require('./locale/ru.json'),
  sv: require('./locale/sv.json'),
  'zh-CN': require('./locale/zh_CN.json'),
  'zh-TW': require('./locale/zh_TW.json'),
};

const {languageTag} = RNLocalize.findBestAvailableLanguage(
  Object.keys(i18n.translations),
) || {languageTag: 'en', isRTL: false};

i18n.locale = languageTag;
i18n.fallbacks = true;

enableScreens();

// TODO: Use NativeStackNavigator instead?
const Stack = createStackNavigator();

class Discourse extends React.Component {
  constructor(props) {
    super(props);
    this._siteManager = new SiteManager();

    this._handleAppStateChange = nextAppState => {
      console.log('Detected appState change: ' + nextAppState);

      if (nextAppState.match(/inactive|background/)) {
        this._seenNotificationMap = null;
        clearInterval(this.state.refreshInterval);
      } else {
        StatusBar.setHidden(false);
        this._siteManager.refreshSites();

        const intervalId = setInterval(
          this._refreshPeriodically.bind(this),
          30000,
        );
        this.setState({refreshInterval: intervalId});
      }
    };

    this._handleOpenUrl = this._handleOpenUrl.bind(this);

    if (Platform.OS === 'ios') {
      PushNotificationIOS.addEventListener('notification', e =>
        this._handleRemoteNotification(e),
      );
      // PushNotificationIOS.addEventListener("localNotification", e =>
      //   this._handleLocalNotification(e)
      // );

      PushNotificationIOS.addEventListener('register', s => {
        console.log('registered for push notifications', s);
        this._siteManager.registerClientId(s);
      });

      PushNotificationIOS.getInitialNotification().then(e => {
        if (e) {
          this._handleRemoteNotification(e);
        }
      });
    }

    if (Platform.OS === 'android') {
      const channel = new firebase.notifications.Android.Channel(
        'discourse',
        'Discourse',
        firebase.notifications.Android.Importance.Max,
      ).setDescription('Discourse notifications channel.');

      // Create the channel
      firebase.notifications().android.createChannel(channel);

      firebase
        .messaging()
        .getToken()
        .then(fcmToken => {
          if (fcmToken) {
            this._siteManager.registerClientId(fcmToken);
          }
        });

      this.onTokenRefreshListener = firebase
        .messaging()
        .onTokenRefresh(fcmToken => {
          if (fcmToken) {
            this._siteManager.registerClientId(fcmToken);
          }
        });
    }

    const colorScheme = Appearance.getColorScheme();

    this.state = {
      hasNotch: DeviceInfo.hasNotch(),
      deviceId: DeviceInfo.getDeviceId(),
      theme: colorScheme === 'dark' ? themes.dark : themes.light,
    };

    this.setRootBackground(colorScheme);

    this.subscription = Appearance.addChangeListener(() => {
      const newColorScheme = Appearance.getColorScheme();
      this.setRootBackground(newColorScheme);
      this.setState({
        theme: newColorScheme === 'dark' ? themes.dark : themes.light,
      });
    });

    // Toggle dark mode for older Androids (using a custom button in DebugRow)
    if (Platform.OS === 'android' && Platform.Version < 29) {
      AsyncStorage.getItem('@Discourse.androidLegacyTheme').then(
        storedTheme => {
          this.setState({
            theme:
              storedTheme && storedTheme === 'dark'
                ? themes.dark
                : themes.light,
          });
        },
      );
    }
  }

  setRootBackground(colorScheme) {
    if (Platform.OS === 'android') {
      return;
    }

    if (colorScheme === 'dark') {
      RootViewBackgroundColor.setBackground(0, 0, 0, 1);
    } else {
      RootViewBackgroundColor.setBackground(255, 255, 255, 1);
    }
  }

  // _handleLocalNotification(e) {
  //   console.log("got local notification", e);
  //   if (
  //     AppState.currentState !== "active" &&
  //     e._data &&
  //     e._data.discourse_url
  //   ) {
  //     this.openUrl(e._data.discourse_url);
  //   }
  // }

  _handleRemoteNotification(e) {
    console.log('got remote notification', e);
    if (e._data && e._data.discourse_url) {
      this._siteManager
        .setActiveSite(e._data.discourse_url)
        .then(activeSite => {
          let supportsDelegatedAuth = false;
          if (this._siteManager.supportsDelegatedAuth(activeSite)) {
            supportsDelegatedAuth = true;
          }
          this.openUrl(e._data.discourse_url, supportsDelegatedAuth);
        });
    }
  }

  _handleOpenUrl(event) {
    console.log('_handleOpenUrl', event);

    if (event.url.startsWith('discourse://')) {
      let params = this.parseURLparameters(event.url);
      let site = this._siteManager.activeSite;

      if (Platform.OS === 'ios' && Settings.get('external_links_svc')) {
        SafariView.dismiss();
      }

      // initial auth payload
      if (params.payload) {
        this._siteManager.handleAuthPayload(params.payload);
      }

      // received one-time-password request from SafariView
      if (params.otp) {
        this._siteManager
          .generateURLParams(site, 'full')
          .then(generatedParams => {
            SafariWebAuth.requestAuth(
              `${site.url}/user-api-key/otp?${generatedParams}`,
            );
          });
      }

      // one-time-password received, launch site with it
      if (params.oneTimePassword) {
        const OTP = this._siteManager.decryptHelper(params.oneTimePassword);
        this.openUrl(`${site.url}/session/otp/${OTP}`);
      }

      // handle site URL passed via app-argument
      if (params.siteUrl) {
        if (this._siteManager.exists({url: params.siteUrl})) {
          console.log(`${params.siteUrl} exists!`);
          this.openUrl(params.siteUrl);
        } else {
          console.log(`${params.siteUrl} does not exist, attempt adding`);
          Site.fromTerm(params.siteUrl)
            .then(newSite => {
              if (newSite) {
                this._siteManager.add(newSite);
              }
            })
            .catch(e => {
              console.log('Error adding site via app-argument:', e);
            })
            .done();
        }
      }

      // handle shared URLs
      if (params.sharedUrl) {
        this._siteManager.setActiveSite(params.sharedUrl).then(activeSite => {
          if (activeSite.activeSite !== undefined) {
            let supportsDelegatedAuth = false;
            if (this._siteManager.supportsDelegatedAuth(activeSite)) {
              supportsDelegatedAuth = true;
            }
            this.openUrl(params.sharedUrl, supportsDelegatedAuth);
          } else {
            Alert.alert('Could not load that URL.');
          }
        });
      }
    }
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
    Linking.addEventListener('url', this._handleOpenUrl);
    Linking.getInitialURL().then(url => {
      if (url) {
        this._handleOpenUrl({url: url});
      }
    });

    if (Platform.OS === 'ios') {
      PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      });

      addShortcutListener(({userInfo, activityType}) => {
        // Do something with the userInfo and/or activityType
        if (userInfo.siteUrl) {
          this._handleOpenUrl({
            url: `discourse://share?sharedUrl=${userInfo.siteUrl}`,
          });
        }
      });

      eventEmitter.addListener('keyInputEvent', res => {
        const {input} = res;

        if (input === 'W') {
          this._navigation.navigate('Home');
        } else {
          const index = parseInt(input, 10) - 1;
          const site = this._siteManager.getSiteByIndex(index);

          if (site) {
            this.openUrl(site.url);
          }
        }
      });
    }

    if (Platform.OS === 'android') {
      // notification opened while app is in foreground or background
      this.removeNotificationOpenedListener = firebase
        .notifications()
        .onNotificationOpened((notificationOpen: NotificationOpen) => {
          console.log('onNotificationOpened');
          this.handleAndroidOpeNotification(notificationOpen);
        });

      // notification opened from closed app
      firebase
        .notifications()
        .getInitialNotification()
        .then((notificationOpen: NotificationOpen) => {
          console.log('getInitialNotification');
          this.handleAndroidOpeNotification(notificationOpen);
        });

      // notification received while in foreground
      this.foregroundNNotificationListener = firebase
        .notifications()
        .onNotification(notification => {
          bgMessaging(notification);
        });
    }

    // BackgroundFetch register (15-minute minimum interval allowed)
    BackgroundFetch.configure(
      {minimumFetchInterval: 15},
      async taskId => {
        console.log('[js] Received background-fetch event: ', taskId);

        this._siteManager.refreshing = false;
        this._siteManager.refreshSites().done(() => {
          this._siteManager.updateUnreadBadge();
          // Required: Signal completion of your task to native code
          // If you fail to do this, the OS can terminate your app
          // or assign battery-blame for consuming too much background-time
          BackgroundFetch.finish(taskId);
        });
      },
      error => {
        console.log('[js] RNBackgroundFetch failed to start');
      },
    );

    const intervalId = setInterval(this._refreshPeriodically.bind(this), 30000);
    this.setState({refreshInterval: intervalId});
  }

  _refreshPeriodically() {
    AsyncStorage.getItem('@Discourse.lastRefresh').then(date => {
      if (date) {
        const lastRun = new Date(date).getTime(),
          now = new Date().getTime();
        if (now - lastRun > 20000) {
          this._siteManager.refreshSites();
        } else {
          console.log('no period refresh, it was last refreshed too recently');
        }
      } else {
        this._siteManager.refreshSites();
      }
    });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
    Linking.removeEventListener('url', this._handleOpenUrl);
    clearTimeout(this.safariViewTimeout);

    if (Platform.OS === 'android') {
      this.removeNotificationOpenedListener();
      this.foregroundNNotificationListener();
    }

    if (this.subscription) {
      this.subscription.remove();
    }
  }

  parseURLparameters(string) {
    let parsed = {};
    (string.split('?')[1] || string)
      .split('&')
      .map(item => {
        return item.split('=');
      })
      .forEach(item => {
        parsed[item[0]] = decodeURIComponent(item[1]);
      });
    return parsed;
  }

  handleAndroidOpeNotification(notificationOpen) {
    if (notificationOpen && notificationOpen.notification) {
      const notification: Notification = notificationOpen.notification;
      if (notification._data && notification._data.discourse_url) {
        this.openUrl(notification._data.discourse_url);
      }
    }
  }

  openUrl(url, supportsDelegatedAuth = true) {
    if (Platform.OS === 'ios') {
      if (!supportsDelegatedAuth) {
        this.safariViewTimeout = setTimeout(() => SafariView.show({url}), 400);
      } else {
        SafariView.dismiss();

        this._navigation.navigate('WebView', {
          url: url,
        });
      }
    }

    if (Platform.OS === 'android') {
      AsyncStorage.getItem('@Discourse.androidCustomTabs').then(value => {
        if (value) {
          CustomTabs.openURL(url, {
            enableUrlBarHiding: true,
            showPageTitle: false,
          }).catch(err => {
            console.error(err);
          });
        } else {
          Linking.openURL(url);
        }
      });
    }
  }

  _toggleTheme(newTheme) {
    this.setState({
      theme: newTheme === 'dark' ? themes.dark : themes.light,
    });
  }

  render() {
    // TODO: pass only relevant props to each screen component
    const screenProps = {
      openUrl: this.openUrl.bind(this),
      _handleOpenUrl: this._handleOpenUrl,
      seenNotificationMap: this._seenNotificationMap,
      setSeenNotificationMap: map => {
        this._seenNotificationMap = map;
      },
      siteManager: this._siteManager,
      hasNotch: this.state.hasNotch,
      deviceId: this.state.deviceId,
      toggleTheme: this._toggleTheme.bind(this),
    };

    return (
      <NavigationContainer>
        <ThemeContext.Provider value={this.state.theme}>
          <StatusBar barStyle={this.state.theme.barStyle} />
          <Stack.Navigator
            initialRouteName="Home"
            presentation="modal"
            screenOptions={({navigation}) => {
              this._navigation = navigation;
              return {
                headerShown: false,
                ...TransitionPresets.ModalSlideFromBottomIOS,
              };
            }}>
            <Stack.Screen name="Home">
              {props => (
                <Screens.Home {...props} screenProps={{...screenProps}} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Notifications">
              {props => (
                <Screens.Notifications
                  {...props}
                  screenProps={{...screenProps}}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Settings">
              {props => (
                <Screens.Settings {...props} screenProps={{...screenProps}} />
              )}
            </Stack.Screen>
            <Stack.Screen name="WebView">
              {props => (
                <Screens.WebView {...props} screenProps={{...screenProps}} />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </ThemeContext.Provider>
      </NavigationContainer>
    );
  }
}

export default Discourse;
