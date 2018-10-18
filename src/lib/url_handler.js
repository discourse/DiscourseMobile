import { Linking, Settings } from "react-native";
import UrlParser from "url";
import Browser from "Libs/browser";
import { InvalidSite } from "Libs/errors";

export default class UrlHandler {
  constructor(siteManager) {
    this.siteManager = siteManager;
  }

  open(url, authToken = false) {
    console.log("open", url, authToken, this.siteManager);
    const siteManager = this.siteManager;
    return new Promise((resolve, reject) => {
      const originalUrl =
        url ||
        "https://meta.discourse.org/t/exploring-serviceworkers-for-discourse/32422/22";
      const parsedUrl = UrlParser.parse(originalUrl);

      siteManager.storedSites().then(sites => {
        const site = sites.find(s => {
          return s.url.includes(parsedUrl.host);
        });

        if (site) {
          this.openUrl(originalUrl, site.authToken);
        } else {
          reject(parsedUrl.host);
        }
      });
    });
  }

  async openAuthUrl(url) {
    return new Promise((resolve, reject) => {
      Browser.openAuthSessionAsync(url)
        .then(result => {
          Browser.dismissBrowser;

          if (result.type === "success") {
            resolve(result.url);
          } else {
            reject(new InvalidSite());
          }
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  openUrl(url, authToken = false, options) {
    options = options || {};

    const notification = options.notification || false;

    let openInSafari = true;
    if (notification) {
      openInSafari = Settings.get("open_notifications_in_safari");
    } else {
      openInSafari = Settings.get("open_links_in_safari");
    }

    console.log("openUrl", openInSafari, notification, authToken);

    if (authToken) {
      if (openInSafari) {
        Linking.openURL(url);
      } else {
        Browser.openBrowserAsync(url);
      }
    } else {
      alert("NOT AUTH");
    }
  }
}
