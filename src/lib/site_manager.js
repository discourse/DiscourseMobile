import _ from "lodash";

import { AsyncStorage, Platform, PushNotificationIOS } from "react-native";

import Site from "Models/site";
import Client from "Libs/client";
import BackgroundJob from "Libs/background-job";
import UrlParser from "url";

class SiteManager {
  constructor() {
    this._subscribers = [];
    this.sites = [];
    this.client = new Client();
    // this.firstFetch = new Date();
    // this.lastFetch = new Date();
    // this.fetchCount = 0;
    //
    // AsyncStorage.getItem("@Discourse.lastRefresh").then(date => {
    //   if (date) {
    //     this.lastRefresh = new Date(date);
    //     this._onRefresh;
    //   }
    // });
  }

  authenticatedSites() {
    return (this.sites || []).filter(site => site.authToken);
  }

  refreshStalledSites(options) {
    const stalledSites = [];

    this.sites.forEach(site => {
      if (site.shouldRefreshOnEnterForeground) {
        stalledSites.push(site);
      }
    });

    options.sites = stalledSites;

    return this.forceRefreshSites(options);
  }

  forceRefreshSites(options = {}) {
    const sites = options.sites || this.authenticatedSites() || [];

    console.log(
      `[SITE MANAGER] Force refresh ${sites.map(s => s.url).join(",")}`
    );

    return new Promise(resolve => {
      Promise.all(sites.map(site => site.refresh(options))).then(events => {
        events.forEach(event => {
          event.site
            .loadTopics()
            .then(() => resolve())
            .finally(() => {
              event.site.setState({ isLoading: false });
            });
        });
      });
    }).then(() => this.save());
  }

  preloadSites() {
    return new Promise(resolve => {
      this.storedSites().then(sites => {
        this.sites = sites;
        resolve(sites);
      });
    });
  }

  storedSites() {
    return new Promise(resolve => {
      AsyncStorage.getItem("@Discourse.sites")
        .then(json => {
          if (json) {
            const sites = JSON.parse(json).map(obj => {
              return new Site(obj);
            });

            resolve(sites);
          } else {
            resolve([]);
          }
        })
        .catch(() => resolve([]));
    });
  }

  registerClientId(id) {
    this.client.getId().then(existing => {
      this.sites.forEach(site => {
        site.clientId = id;
      });

      if (existing !== id) {
        AsyncStorage.setItem("@ClientId", id);
        this.sites.forEach(site => {
          site.authToken = null;
          site.userId = null;
        });
        this.save();
      }
    });
  }

  refreshInterval(interval) {
    if (this._refresher) {
      clearInterval(this._refresher);
      this._refresher = null;
    }

    this._refreshInterval = interval;

    if (interval > 0) {
      this._refresher = setInterval(() => {
        this.refreshSites({ ui: false, fast: true });
      }, interval);
    }
  }

  exists(site) {
    return !!_.find(this.sites, { url: site.url });
  }

  add(site) {
    this.sites.push(site);
    this.save();
    this._onChange();
  }

  remove(site) {
    return new Promise(resolve => {
      let index = this.sites.indexOf(site);
      if (index >= 0) {
        let removableSite = this.sites.splice(index, 1)[0];
        removableSite.revokeApiKey().catch(e => {
          console.log(`Failed to revoke API Key ${e}`);
        });
        this.save();
        this._onChange();
        this.updateUnreadBadge();
      }

      resolve();
    });
  }

  updateOrder(from, to) {
    this.sites.splice(to, 0, this.sites.splice(from, 1)[0]);
    this.save();
    this._onChange();
  }

  subscribe(callback) {
    this._subscribers.push(callback);
  }

  unsubscribe(callback) {
    var pos = this._subscribers.indexOf(callback);
    if (pos >= -1) {
      this._subscribers.splice(pos, 1);
    }
  }

  updateUnreadBadge() {
    if (Platform.OS === "ios") {
      PushNotificationIOS.checkPermissions(p => {
        if (p.badge) {
          PushNotificationIOS.setApplicationIconBadgeNumber(this.totalUnread());
        }
      });
    }
  }

  save() {
    return new Promise((resolve, reject) => {
      AsyncStorage.setItem("@Discourse.sites", JSON.stringify(this.sites)).then(
        () => {
          this.updateUnreadBadge();
          resolve(this.sites);
          this._onChange();
        }
      );
    });
  }

  isLoading() {
    return !!this._loading;
  }

  siteForUrl(url) {
    const parsedUrl = UrlParser.parse(url);

    return new Promise((resolve, reject) => {
      this.storedSites().then(sites => {
        const site = sites.find(s => {
          return s.url.includes(parsedUrl.host);
        });

        if (site) {
          resolve(site);
        } else {
          reject(parsedUrl.host);
        }
      });
    });
  }

  totalUnread() {
    let count = 0;
    this.sites.forEach(site => {
      if (site.authToken) {
        count +=
          (site.unreadNotifications || 0) + (site.unreadPrivateMessages || 0);
        if (site.isStaff) {
          count += site.flagCount || 0;
        }
      }
    });
    return count;
  }

  waitFor(duration, check) {
    let start = new Date();

    return new Promise((resolve, reject) => {
      let interval = setInterval(() => {
        if (check()) {
          clearInterval(interval);
          resolve();
          return;
        }
        if (new Date() - start > duration) {
          clearInterval(interval);
          reject();
          return;
        }
      }, 10);
    });
  }

  enterBackground() {
    let enterBg = id => {
      if (id) {
        BackgroundJob.finish(id);
      }
      this._background = true;
      this.sites.forEach(s => s.enterBackground());
    };

    if (this._refresher) {
      clearInterval(this._refresher);
      this._refresher = null;
    }

    if (this.refreshing) {
      // let it finish
      BackgroundJob.start()
        .then(id => {
          this.waitFor(20000, () => !this.refreshing).finally(() => {
            enterBg(id);
          });
        })
        .catch(() => {
          // not implemented on android yet
          enterBg();
        });
    } else {
      BackgroundJob.start()
        .then(id => {
          this.refreshSites({
            ui: false,
            background: true,
            forceRefresh: true
          }).finally(() => enterBg(id));
        })
        .catch(() => {
          // android fallback
          enterBg();
        });
    }
  }

  exitBackground() {
    this._background = false;
    this.sites.forEach(s => s.exitBackground());
    this.refreshInterval(this._refreshInterval);
    // in case UI did not pick up changes
    this._onChange();
    this._onRefresh();
  }

  toObject() {
    let object = {};
    this.sites.forEach(site => {
      object[site.url] = site;
    });
    return object;
  }

  _onRefresh() {
    this._subscribers.forEach(sub => sub({ event: "refresh" }));
  }

  _onChange() {
    this._subscribers.forEach(sub => sub({ event: "change" }));
  }
}

export default SiteManager;
