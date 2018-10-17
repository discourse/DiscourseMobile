import { Alert, Linking, Settings } from "react-native";

import Site from "./site";
import { UnexistingSite } from "./errors";
import _ from "lodash";
import DiscourseSafariViewManager from "../lib/discourse-safari-view-manager";
import UrlParser from "url";

export default class ExternalUrlHandler {
  constructor(siteManager) {
    alert(1);
    alert(siteManager);
    this._siteManager = siteManager;
  }

  open(url) {
    return new Promise(function(resolve, reject) {
      const originalUrl =
        url ||
        "https://meta.discourse.org/t/exploring-serviceworkers-for-discourse/32422/22";
      const parsedUrl = UrlParser.parse(originalUrl);

      // reject(new UnexistingSite());
      alert(2);
      alert(this._siteManager);
      this._siteManager.storedSites().then(sites => {
        const site = sites.find(s => {
          return s.url.includes(parsedUrl.host);
        });

        if (site) {
          this.openUrl(originalUrl, site.authToken);
          resolve(url);
        } else {
          reject(url);
        }
      });
    });
  }

  async openUrl(url, authToken = false, options) {
    options = options || {};

    const notification = options.notification || false;

    let openInSafari = true;
    if (notification) {
      openInSafari = Settings.get("open_notifications_in_safari");
    } else {
      openInSafari = Settings.get("open_links_in_safari");
    }

    if (authToken) {
      if (openInSafari) {
        Linking.openURL(url);
      } else {
        DiscourseSafariViewManager.openBrowserAsync(url);
      }

      // this.siteManager.refreshInterval(60000);
    } else {
      // let result = await DiscourseSafariViewManager.openAuthSessionAsync(url);
      DiscourseSafariViewManager.openBrowserAsync(url);

      // DiscourseSafariViewManager.dismissBrowser;

      // if (result.type === "success") {
      // Linking.openURL(result.url);
      // } else {
      // Alert.alert("Error while authenticating with this Discourse isntance");
      // }
    }
  }
}
