import { Linking, Settings } from "react-native";
import Browser from "Libs/browser";
import { InvalidSite } from "Libs/errors";

export default class UrlHandler {
  constructor(siteManager) {
    this.siteManager = siteManager;
  }

  open(url, authToken = false) {
    const siteManager = this.siteManager;

    return new Promise((resolve, reject) => {
      siteManager
        .siteForUrl(url)
        .then(site => {
          return this.openUrl(url, site.authToken)
            .then(event => resolve(event))
            .catch(() => reject({ event: "error", url }));
        })
        .catch(() => reject({ event: "error", url }))
        .finally(() => resolve({ event: "success", url }));
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
        .catch(e => reject(e));
    });
  }

  openUrl(url, authToken = false, options) {
    console.log(`[URL HANDLER] Opening ${url}`);

    options = options || {};

    const notification = options.notification || false;

    let openInSafari = true;
    if (notification) {
      openInSafari = Settings.get("open_notifications_in_safari");
    } else {
      openInSafari = Settings.get("open_links_in_safari");
    }

    return new Promise((resolve, reject) => {
      if (authToken) {
        if (openInSafari) {
          Linking.openURL(url)
            .then(() => resolve({ event: "success", url }))
            .catch(() => reject());
        } else {
          Browser.openBrowserAsync(url)
            .then(() => {
              resolve({ event: "closing", url });
            })
            .catch(() => reject());
        }
      } else {
        reject();
      }
    });
  }
}
