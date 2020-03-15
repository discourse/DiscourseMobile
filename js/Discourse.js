/* @flow */
'use strict';

import React from 'react';
import {ThemeContext, themes} from './ThemeContext';

import {
  Alert,
  AppState,
  Linking,
  NativeModules,
  Platform,
  StatusBar,
} from 'react-native';

import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';

import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {AppearanceProvider, Appearance} from 'react-native-appearance';

import Screens from './screens';
import Site from './site';
import SiteManager from './site_manager';
import SafariView from 'react-native-safari-view';
import SafariWebAuth from 'react-native-safari-web-auth';
import DeviceInfo from 'react-native-device-info';

const ChromeCustomTab = NativeModules.ChromeCustomTab;

import firebase from './firebase/helper';
import type {Notification, NotificationOpen} from './firebase/helper';
import bgMessaging from './firebase/bgMessaging';
import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-community/async-storage';

const AppNavigator = createStackNavigator(
  {
    Home: {screen: Screens.Home},
    Notifications: {screen: Screens.Notifications},
    WebView: {screen: Screens.WebView},
  },
  {
    mode: 'modal',
    headerMode: 'none',
  },
);

const AppContainer = createAppContainer(AppNavigator);

class Discourse extends React.Component {
  constructor(props) {
    super(props);
    this._siteManager = new SiteManager();

    this._handleAppStateChange = nextAppState => {
      console.log('Detected appstate change: ' + nextAppState);

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
      hasNotch: true,
      deviceId: '',
      theme: colorScheme === 'dark' ? themes.dark : themes.light,
    };

    DeviceInfo.hasNotch().then(hasNotch => {
      if (hasNotch === false) {
        this.setState({hasNotch: false});
      }
    });

    DeviceInfo.getDeviceId().then(deviceId => {
      this.setState({deviceId: deviceId});
    });

    this.subscription = Appearance.addChangeListener(({colorScheme}) => {
      this.setState({
        theme: colorScheme === 'dark' ? themes.dark : themes.light,
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

      if (Platform.OS === 'ios') {
        SafariView.dismiss();
      }

      // initial auth payload
      if (params.payload) {
        this._siteManager.handleAuthPayload(params.payload);
      }

      // received one-time-password request from SafariView
      if (params.otp) {
        this._siteManager.generateURLParams(site, 'full').then(params => {
          SafariWebAuth.requestAuth(`${site.url}/user-api-key/otp?${params}`);
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
            .then(site => {
              if (site) {
                this._siteManager.add(site);
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
      PushNotificationIOS.requestPermissions({alert: true, badge: true});
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
    this._siteManager.refreshSites();
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
    Linking.removeEventListener('url', this._handleOpenUrl);
    clearTimeout(this.safariViewTimeout);
    if (Platform.OS === 'android') {
      this.removeNotificationOpenedListener();
      this.foregroundNNotificationListener();
    }
    this.subscription.remove();
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
    } else {
      if (this.props.simulator) {
        Linking.openURL(url);
      } else {
        ChromeCustomTab.show(url)
          .then(() => {})
          .catch(e => {
            // if Chrome is not installed, use any other available browser
            Linking.openURL(url);
          });
      }
    }
  }

  _toggleTheme(newTheme) {
    this.setState({
      theme: newTheme === 'dark' ? themes.dark : themes.light,
    });
  }

  render() {
    return (
      <ThemeContext.Provider value={this.state.theme}>
        <AppearanceProvider>
          <StatusBar barStyle={this.state.theme.barStyle} />
          <AppContainer
            ref={ref => (this._navigation = ref && ref._navigation)}
            style={{flex: 1}}
            screenProps={{
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
            }}
          />
        </AppearanceProvider>
      </ThemeContext.Provider>
    );
  }
}

export default Discourse;
