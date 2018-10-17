import {
  AppState,
  Platform,
  PushNotificationIOS,
  Settings
} from "react-native";

import React from "react";

import SiteManager from "./src/site_manager";
import HubScreen from "screens/hub";

export default class Discourse extends React.Component {
  constructor(props) {
    super(props);

    this._siteManager = new SiteManager();

    if (this.props.url) {
      this.openUrl(this.props.url);
    }
    //
    // this._handleAppStateChange = () => {
    //   console.log("Detected appstate change " + AppState.currentState);
    //
    //   if (AppState.currentState === "inactive") {
    //     this._siteManager.enterBackground();
    //     this._seenNotificationMap = null;
    //     this.resetToTop();
    //   }
    //
    //   if (AppState.currentState === "active") {
    //     this._siteManager.exitBackground();
    //     this._siteManager.refreshSites({ ui: false, fast: true });
    //   }
    // };
  }

  componentDidMount() {
    // AppState.addEventListener("change", this._handleAppStateChange);

    if (Platform.OS === "ios") {
      PushNotificationIOS.requestPermissions({ alert: true, badge: true });

      if (typeof Settings.get("open_links_in_safari") === undefined) {
        Settings.set({ open_links_in_safari: 1 });
      }

      if (typeof Settings.get("open_notifications_in_safari") === undefined) {
        Settings.set({ open_notifications_in_safari: 1 });
      }
    }
  }

  // componentWillUnmount() {
  //   AppState.removeEventListener("change", this._handleAppStateChange);
  // }

  render() {
    return <HubScreen siteManager={this._siteManager} />;
  }
}
