import { Platform, PushNotificationIOS, Settings } from "react-native";

import React from "react";

import SiteManager from "Libs/site_manager";
import HubScreen from "Screens/hub";

export default class Discourse extends React.Component {
  constructor(props) {
    super(props);

    this.siteManager = new SiteManager();
  }

  componentDidMount() {
    if (Platform.OS === "ios") {
      PushNotificationIOS.requestPermissions({ alert: true, badge: true });

      if (typeof Settings.get("open_links_in_safari") === "undefined") {
        Settings.set({ open_links_in_safari: 1 });
      }

      if (typeof Settings.get("open_notifications_in_safari") === "undefined") {
        Settings.set({ open_notifications_in_safari: 1 });
      }
    }
  }

  render() {
    return <HubScreen siteManager={this.siteManager} />;
  }
}
