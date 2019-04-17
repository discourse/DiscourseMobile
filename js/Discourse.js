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
  StatusBar,
  StyleSheet
} from "react-native";

import { StackNavigator, NavigationActions } from "react-navigation";

import Screens from "./screens";
import SiteManager from "./site_manager";
import SafariView from "react-native-safari-view";
import SafariWebAuth from "react-native-safari-web-auth";
import AsyncStorage from "@react-native-community/async-storage";

const ChromeCustomTab = NativeModules.ChromeCustomTab;
const AndroidToken = NativeModules.AndroidToken;

const AppNavigator = StackNavigator(
  {
    Home: { screen: Screens.Home },
    Notifications: { screen: Screens.Notifications },
    WebView: { screen: Screens.WebView }
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

    this._handleAppStateChange = () => {
      console.log("Detected appstate change " + AppState.currentState);

      if (AppState.currentState === "inactive") {
        this._siteManager.enterBackground();
        this._seenNotificationMap = null;
      }

      if (AppState.currentState === "active") {
        StatusBar.setHidden(false);
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
      // PushNotificationIOS.addEventListener("localNotification", e =>
      //   this._handleLocalNotification(e)
      // );

      PushNotificationIOS.addEventListener("register", s => {
        console.log("registered for push notifications", s);
        this._siteManager.registerClientId(s);
      });

      PushNotificationIOS.getInitialNotification().then(e => {
        if (e) {
          this._handleRemoteNotification(e);
        }
      });
    }

    if (Platform.OS === "android") {
      AndroidToken.GetInstanceId(id => {
        this._siteManager.registerClientId(id);
      });
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
    console.log("got remote notification", e);
    if (e._data && e._data.discourse_url) {
      this._siteManager
        .setActiveSite(e._data.discourse_url)
        .then(activeSite => {
          this.resetToTop(); // close any open webviews
          let supportsDelegatedAuth = false;
          if (this._siteManager.supportsDelegatedAuth(activeSite)) {
            supportsDelegatedAuth = true;
          }
          this.openUrl(e._data.discourse_url, supportsDelegatedAuth);
        });
    }
  }

  _handleOpenUrl(event) {
    console.log("_handleOpenUrl", event);
    if (event.url.startsWith("discourse://")) {
      let params = this.parseURLparameters(event.url);
      let site = this._siteManager.activeSite;

      if (Platform.OS === "ios") {
        SafariView.dismiss();
      }

      // initial auth payload
      if (params.payload) {
        this._siteManager.handleAuthPayload(params.payload);
      }

      // received one-time-password request from SafariView
      if (params.otp) {
        this._siteManager.generateURLParams(site, "full").then(params => {
          SafariWebAuth.requestAuth(`${site.url}/user-api-key/otp?${params}`);
        });
      }

      // one-time-password received, launch site with it
      if (params.oneTimePassword) {
        const OTP = this._siteManager.decryptHelper(params.oneTimePassword);
        this.openUrl(`${site.url}/session/otp/${OTP}`);
      }

      // handle URL passed via app-argument
      if (params.siteUrl) {
        if (this._siteManager.exists(params.siteUrl)) {
          this.openUrl(params.siteUrl);
        } else {
          this._siteManager.add(params.siteUrl);
        }
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
    clearTimeout(this.safariViewTimeout);
  }

  parseURLparameters(string) {
    let parsed = {};
    (string.split("?")[1] || string)
      .split("&")
      .map(item => {
        return item.split("=");
      })
      .forEach(item => {
        parsed[item[0]] = decodeURIComponent(item[1]);
      });
    return parsed;
  }

  openUrl(url, supportsDelegatedAuth = true) {
    if (Platform.OS === "ios") {
      if (!supportsDelegatedAuth) {
        this.safariViewTimeout = setTimeout(
          () => SafariView.show({ url }),
          400
        );
      } else {
        this._navigation.navigate("WebView", {
          url: url
        });
      }
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
          _handleOpenUrl: this._handleOpenUrl,
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
