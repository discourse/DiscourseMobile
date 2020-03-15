/* @flow */
'use strict';

import _ from 'lodash';
import Moment from 'moment';

import {Alert, AppState, Platform} from 'react-native';

import PushNotificationIOS from '@react-native-community/push-notification-ios';
import AsyncStorage from '@react-native-community/async-storage';
import Site from './site';
import RNKeyPair from 'react-native-key-pair';
import DeviceInfo from 'react-native-device-info';
import JSEncrypt from './../lib/jsencrypt';
import randomBytes from './../lib/random-bytes';

class SiteManager {
  constructor() {
    this._subscribers = [];
    this.sites = [];
    this.activeSite = null;
    this.urlScheme = 'discourse://auth_redirect';

    this.load();

    this.firstFetch = new Date();
    this.lastFetch = new Date();
    this.fetchCount = 0;

    AsyncStorage.getItem('@Discourse.lastRefresh').then(date => {
      if (date) {
        this.lastRefresh = new Date(date);
      }
    });

    this.deviceName = 'Discourse - Unknown Mobile Device';

    DeviceInfo.getDeviceName().then(name => {
      this.deviceName = `Discourse - ${name}`;
    });
  }

  exists(site) {
    return !!_.find(this.sites, {url: site.url});
  }

  add(site) {
    this.sites.push(site);
    this.save();
  }

  remove(site) {
    let index = this.sites.indexOf(site);
    if (index >= 0) {
      let removableSite = this.sites.splice(index, 1)[0];
      removableSite.revokeApiKey().catch(e => {
        console.log(`Failed to revoke API Key ${e}`);
      });
      this.save();
    }
  }

  setActiveSite(site) {
    return new Promise((resolve, reject) => {
      if (typeof site === 'string' || site instanceof String) {
        let url = site;
        AsyncStorage.getItem('@Discourse.sites')
          .then(json => {
            let activeSite = null;
            if (json) {
              let tSites = JSON.parse(json).map(obj => {
                return new Site(obj);
              });

              activeSite = tSites.find(s => url.startsWith(s.url) === true);
              this.activeSite = activeSite;
            }

            resolve({activeSite: activeSite});
          })
          .done();
      } else {
        this.activeSite = site;
        resolve({activeSite: site});
        return;
      }
    });
  }

  updateOrder(from, to) {
    this.sites.splice(to, 0, this.sites.splice(from, 1)[0]);
    this.save();
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
    if (Platform.OS === 'ios') {
      PushNotificationIOS.checkPermissions(p => {
        if (p.badge) {
          PushNotificationIOS.setApplicationIconBadgeNumber(this.totalUnread());
        }
      });
    }
  }

  save() {
    AsyncStorage.setItem('@Discourse.sites', JSON.stringify(this.sites)).done();
    this._onChange();
    this.updateUnreadBadge();
  }

  ensureRSAKeys() {
    return new Promise((resolve, reject) => {
      if (this.rsaKeys) {
        resolve();
        return;
      }

      AsyncStorage.getItem('@Discourse.rsaKeys').then(json => {
        if (json) {
          this.rsaKeys = JSON.parse(json);
          resolve();
        } else {
          RNKeyPair.generate(pair => {
            this.rsaKeys = pair;
            AsyncStorage.setItem(
              '@Discourse.rsaKeys',
              JSON.stringify(this.rsaKeys),
            );
            resolve();
          });
        }
      });
    });
  }

  isLoading() {
    return !!this._loading;
  }

  load() {
    // generate RSA Keys on load, they'll be needed
    this.ensureRSAKeys().done();
    this._loading = true;
    AsyncStorage.getItem('@Discourse.sites')
      .then(json => {
        if (json) {
          this.sites = JSON.parse(json).map(obj => {
            return new Site(obj);
          });

          let promises = [];

          this.sites.forEach((site, index) => {
            // check for updated API version and updated icon
            promises.push(
              site.ensureLatestApi().then(s => {
                if (s.apiVersion !== this.sites[index].apiVersion) {
                  this.sites[index].apiVersion = s.apiVersion;
                }
                if (s.icon && s.icon !== this.sites[index].icon) {
                  this.sites[index].icon = s.icon;
                }

                this.sites[index].lastChecked = Moment().format();
              }),
            );
          });

          Promise.all(promises)
            .then(() => {
              this.save();
              this.refreshSites().then(() => {
                this._onChange();
              });
            })
            .catch(e => {
              console.log(e);
            });
        }
      })
      .finally(() => {
        this._loading = false;
        this._onChange();
      })
      .done();
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

  refreshSites() {
    console.log('refresh ' + this.sites.length + ' sites');

    let sites = this.sites.slice(0),
      promises = [],
      errors = 0;

    if (sites.length === 0) {
      console.log('no sites defined nothing to refresh!');
      return;
    }

    return new Promise((resolve, reject) => {
      sites.forEach(site => {
        if (site.authToken) {
          promises.push(
            site
              .refresh()
              .then(() => {
                // trigger localNotification alerts for sites with no push support (iOS only)
                if (!site.hasPush) {
                  site
                    .getAlerts()
                    .then(alerts => {
                      if (alerts && alerts.length > 0) {
                        alerts.forEach(a => {
                          if (a.id > site._seenNotificationId) {
                            PushNotificationIOS.presentLocalNotification({
                              alertBody: a.excerpt.substr(0, 250),
                              userInfo: {discourse_url: a.url},
                            });

                            site._seenNotificationId = a.id;
                          }
                        });
                      }
                    })
                    .catch(e => {
                      console.log('failed to refresh ' + site.url);
                      console.log(e);
                      errors++;
                    });
                }
              })
              .catch(e => {
                console.log(e);
              }),
          );
        }
      });

      Promise.all(promises)
        .then(() => {
          this.save();

          if (errors < sites.length) {
            this.lastRefresh = new Date();
            AsyncStorage.setItem(
              '@Discourse.lastRefresh',
              this.lastRefresh.toJSON(),
            );
          }

          resolve();
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  serializeParams(obj) {
    return Object.keys(obj)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent([obj[k]])}`)
      .join('&');
  }

  registerClientId(id) {
    console.log('REGISTER CLIENT ID ' + id);

    this.getClientId().then(existing => {
      this.sites.forEach(site => {
        site.clientId = id;
      });

      if (existing !== id) {
        this.clientId = id;
        AsyncStorage.setItem('@ClientId', this.clientId);
        this.sites.forEach(site => {
          site.authToken = null;
          site.userId = null;
        });
        this.save();
      }
    });
  }

  getClientId() {
    return new Promise(resolve => {
      if (this.clientId) {
        resolve(this.clientId);
      } else {
        AsyncStorage.getItem('@ClientId').then(clientId => {
          if (clientId && clientId.length > 0) {
            this.clientId = clientId;
            resolve(clientId);
          } else {
            this.clientId = randomBytes(32);
            AsyncStorage.setItem('@ClientId', this.clientId);
            resolve(this.clientId);
          }
        });
      }
    });
  }

  generateNonce(site) {
    return new Promise(resolve => {
      this._nonce = randomBytes(16);
      this._nonceSite = site;
      resolve(this._nonce);
    });
  }

  decryptHelper(payload) {
    let crypt = new JSEncrypt();
    crypt.setKey(this.rsaKeys.private);
    return crypt.decrypt(payload);
  }

  handleAuthPayload(payload) {
    let decrypted = JSON.parse(this.decryptHelper(payload));

    if (decrypted.nonce !== this._nonce) {
      Alert.alert('We were not expecting this reply, please try again!');
      return;
    }

    this._nonceSite.authToken = decrypted.key;
    this._nonceSite.hasPush = decrypted.push;
    this._nonceSite.apiVersion = decrypted.api;

    // cause we want to stop rendering connect
    this._onChange();

    this._nonceSite
      .refresh()
      .then(() => {
        this._onChange();
      })
      .catch(e => {
        console.log('Failed to refresh ' + this._nonceSite.url + ' ' + e);
      });
  }

  generateAuthURL(site) {
    let clientId;

    return this.ensureRSAKeys().then(() =>
      this.getClientId()
        .then(cid => {
          clientId = cid;
          return this.generateNonce(site);
        })
        .then(nonce => {
          let basePushUrl = 'https://api.discourse.org';
          //let basePushUrl = "http://l.discourse:3000"

          let scopes = 'notifications,session_info';

          if (this.supportsDelegatedAuth(site)) {
            scopes = `${scopes},one_time_password`;
          }

          let params = {
            scopes: scopes,
            client_id: clientId,
            nonce: nonce,
            push_url: basePushUrl + '/api/publish_' + Platform.OS,
            auth_redirect: this.urlScheme,
            application_name: this.deviceName,
            public_key: this.rsaKeys.public,
            discourse_app: 1,
          };

          return `${site.url}/user-api-key/new?${this.serializeParams(params)}`;
        }),
    );
  }

  generateURLParams(site, type = 'basic') {
    return this.ensureRSAKeys().then(() => {
      let params = {
        auth_redirect: this.urlScheme,
        user_api_public_key: this.rsaKeys.public,
      };

      if (type === 'full') {
        params = {
          auth_redirect: this.urlScheme,
          application_name: this.deviceName,
          public_key: this.rsaKeys.public,
        };
      }

      return this.serializeParams(params);
    });
  }

  getSeenNotificationMap() {
    return new Promise(resolve => {
      let promises = [];
      let results = {};

      this.sites.forEach(site => {
        if (site.authToken) {
          promises.push(
            site.getSeenNotificationId().then(function(id) {
              results[site.url] = id;
            }),
          );
        }
      });

      Promise.all(promises).then(() => resolve(results));
    });
  }

  notifications(types, options) {
    return new Promise(resolve => {
      let promises = [];
      this.sites.forEach(site => {
        let opts = options;

        if (opts.onlyNew) {
          opts = _.merge(_.clone(opts), {minId: opts.newMap[site.url]});
        }

        let promise = site.notifications(types, opts).then(notifications => {
          return notifications.map(n => {
            return {notification: n, site: site};
          });
        });

        promises.push(promise);
      });

      Promise.all(promises)
        .then(results => {
          resolve(
            _.chain(results)
              .flatten()
              .orderBy(
                [
                  o => {
                    return !o.notification.read &&
                      o.notification.notification_type === 6
                      ? 0
                      : 1;
                  },
                  'notification.created_at',
                ],
                ['asc', 'desc'],
              )
              .value(),
          );
        })
        .done();
    });
  }

  toObject() {
    let object = {};
    this.sites.forEach(site => {
      object[site.url] = site;
    });
    return object;
  }

  _onChange() {
    this._subscribers.forEach(sub => sub({event: 'change'}));
  }

  supportsDelegatedAuth(site) {
    // delegated auth library is currently iOS 12+ only
    // site needs user api >= 4

    if (
      Platform.OS !== 'ios' ||
      parseInt(Platform.Version, 10) <= 11 ||
      site.apiVersion < 4
    ) {
      return false;
    }

    return true;
  }

  urlInSites(url) {
    let siteUrls = this.sites.map(s => s.url);
    return siteUrls.find(siteUrl => url.startsWith(siteUrl) === true);
  }
}

export default SiteManager;
