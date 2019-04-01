/* @flow */
"use strict";

import React from "react";

import {
  Alert,
  AppState,
  Linking,
  NativeModules,
  Platform,
  PushNotificationIOS,
  StyleSheet
} from "react-native";

import { StackNavigator, NavigationActions } from "react-navigation";

import Screens from "./screens";
import SiteManager from "./site_manager";
import SafariView from "react-native-safari-view";
import SafariWebAuth from "react-native-safari-web-auth";

const ChromeCustomTab = NativeModules.ChromeCustomTab;
const AndroidToken = NativeModules.AndroidToken;

const AppNavigator = StackNavigator(
  {
    Home: { screen: Screens.Home },
    Notifications: { screen: Screens.Notifications }
  },
  {
    mode: "modal",
    headerMode: "none"
  }
);

class Discourse extends React.Component {
  constructor(props) {
    super(props);
    this._siteManager = new SiteManager();

    if (this.props.url) {
      this.openUrl(this.props.url);
    }

    this._handleAppStateChange = () => {
      console.log("Detected appstate change " + AppState.currentState);

      if (AppState.currentState === "inactive") {
        this._siteManager.enterBackground();
        this._seenNotificationMap = null;
        this.resetToTop();
      }

      if (AppState.currentState === "active") {
        this._siteManager.exitBackground();
        this._siteManager.refreshSites({ ui: false, fast: true });
      }
    };

    this._handleOpenUrl = this._handleOpenUrl.bind(this);

    if (Platform.OS === "ios") {
      SafariView.addEventListener("onShow", () => {
        this._siteManager.refreshInterval(60000);
      });

      SafariView.addEventListener("onDismiss", () => {
        this._siteManager.refreshInterval(15000);
        this._siteManager.refreshSites({ ui: false, fast: true });
      });

      PushNotificationIOS.addEventListener("notification", e =>
        this._handleRemoteNotification(e)
      );
      PushNotificationIOS.addEventListener("localNotification", e =>
        this._handleLocalNotification(e)
      );

      PushNotificationIOS.addEventListener("register", s => {
        this._siteManager.registerClientId(s);
      });

      PushNotificationIOS.getInitialNotification().then((e) => {
        console.log('coldLaunchPush:', e);
        this._handleRemoteNotification(e);
      });

    }

    if (Platform.OS === "android") {
      AndroidToken.GetInstanceId(id => {
        this._siteManager.registerClientId(id);
      });
    }
  }

  _handleLocalNotification(e) {
    console.log("got local notification", e);
    if (
      AppState.currentState !== "active" &&
      e._data &&
      e._data.discourse_url
    ) {
      this.openUrl(e._data.discourse_url);
    }
  }

  _handleRemoteNotification(e) {
    console.log("got remote notification", e);
    if (e._data && e._data.discourse_url) {
      this.openUrl(e._data.discourse_url);
    }

    // if (e._data && e._data.openedInForeground && e._data.discourse_url) {
    //   this.openUrl(e._data.discourse_url);
    // }

    // TODO if we are active we should try to notify user somehow that a notification
    // just landed .. tricky thing though is that safari view may be showing so we have
    // no way of presenting anything to the user in that case
  }

  _handleOpenUrl(event) {
    if (event.url.startsWith('discourse://')) {
      let params = this.parseURLparameters(event.url);
      let site = this._siteManager.activeSite;
      if (Platform.OS === "ios") {
        SafariView.dismiss();
      }

      // initial auth payload
      if (params.payload) {
        if (this._siteManager.supportsDelegatedAuth(site) && params.oneTimePassword) {
          this._siteManager.handleAuthPayload(params.payload, params.oneTimePassword);
        } else {
          this._siteManager.handleAuthPayload(params.payload);
        }
      }

      // received one-time-password request from SafariView
      if (params.otp) {
        this._siteManager.generateURLParams(site, "full").then(params => {
          SafariWebAuth.requestAuth(`${site.url}/user-api-key/otp?${params}`);
        });
      }

      // one-time-password received from ASWebAuthentication
      if (params.oneTimePassword && !params.payload) {
        this._siteManager.setOneTimePassword(site, params.oneTimePassword);
        // We could also load the SVC with the oneTimePassword URL
        // but due to React interactions, this only works after a hacky delay
        // setTimeout(() => {
        //   let oneTimePassword = this._siteManager.decryptHelper(params.oneTimePassword);
        //   this.openUrl(`${site.url}/session/otp/${oneTimePassword}`);
        // }, 400);
      }
    }
  }

  resetToTop() {
    if (this._navigation) {
      this._navigation.dispatch(
        NavigationActions.reset({
          index: 0,
          actions: [NavigationActions.navigate({ routeName: "Home" })]
        })
      );
    }
  }

  componentDidMount() {
    AppState.addEventListener("change", this._handleAppStateChange);
    Linking.addEventListener("url", this._handleOpenUrl);

    if (Platform.OS === "ios") {
      PushNotificationIOS.requestPermissions({ alert: true, badge: true });
    }
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this._handleAppStateChange);
    Linking.removeEventListener("url", this._handleOpenUrl);
  }

  parseURLparameters(string) {
    let parsed = {};
    (string.split('?')[1] || string).split('&')
    .map((item) => {
        return item.split('=');
    })
    .forEach((item) => {
        parsed[item[0]] = decodeURIComponent(item[1]);
    });
    return parsed;
  }

  openUrl(url) {
    if (Platform.OS === "ios") {
      SafariView.show({ url });
    } else {
      if (this.props.simulator) {
        Linking.openURL(url);
      } else {
        ChromeCustomTab.show(url)
          .then(() => {})
          .catch(e => {
            Alert.alert(
              "Discourse requires that Google Chrome Stable is installed."
            );
          });
      }
    }
  }

  render() {
    return (
      <AppNavigator
        ref={ref => (this._navigation = ref && ref._navigation)}
        style={styles.app}
        screenProps={{
          resetToTop: this.resetToTop.bind(this),
          openUrl: this.openUrl.bind(this),
          seenNotificationMap: this._seenNotificationMap,
          setSeenNotificationMap: map => {
            this._seenNotificationMap = map;
          },
          siteManager: this._siteManager
        }}
      />
    );
  }
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "white"
  },
  screenContainer: {
    flex: 1
  }
});

export default Discourse;
