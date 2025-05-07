/* @flow */
/* global Request */
'use strict';

import {Platform} from 'react-native';
import _ from 'lodash';
import fetch from './../lib/fetch';

class Site {
  static discoverUrl() {
    return 'https://discover.discourse.com/';
  }

  static FIELDS = [
    'apiVersion',
    'authToken',
    'chatNotifications',
    'createdAt',
    'description',
    'flagCount',
    'hasChatEnabled',
    'hasPush',
    'icon',
    'isStaff',
    'lastChecked',
    'lastVisitedPath',
    'lastVisitedPathAt',
    'loginRequired',
    'queueCount',
    'title',
    'totalNew',
    'totalUnread',
    'unreadNotifications',
    'unreadPrivateMessages',
    'url',
    'username',
  ];

  static fromTerm(term) {
    let url = '';

    term = term.trim();
    while (term.endsWith('/')) {
      term = term.slice(0, term.length - 1);
    }

    if (!term.match(/^https?:\/\//)) {
      url = `https://${term}`;
    } else {
      url = term;
    }

    return Site.fromURL(url);
  }

  static fromURL(url) {
    let req = new Request(`${url}/user-api-key/new`, {
      method: 'HEAD',
    });

    let apiVersion;

    return fetch(req)
      .then(userApiKeyResponse => {
        if (userApiKeyResponse.status === 404) {
          throw 'bad api';
        }

        if (userApiKeyResponse.status !== 200) {
          throw 'bad url';
        }

        let version = userApiKeyResponse.headers.get('Auth-Api-Version');
        apiVersion = parseInt(version, 10);
        if (apiVersion < 2) {
          throw 'bad api';
        }

        // make sure we use the correct URL, eg: a URL could lead us to
        // the correct destination after a redirect, we want to store the
        // final destination and not the origin
        // we also replace any trailing slash
        url = userApiKeyResponse.url
          .replace('/user-api-key/new', '')
          .replace(/\/+$/, '')
          .replace(/:\d+/, '');

        return fetch(`${url}/site/basic-info.json`).then(basicInfoResponse =>
          basicInfoResponse.json(),
        );
      })
      .then(info => {
        const siteInfo = {
          url: url,
          title: info.title,
          description: info.description,
          icon: info.apple_touch_icon_url,
          apiVersion: apiVersion,
          loginRequired: false,
        };

        if ('login_required' in info) {
          siteInfo.loginRequired = info.login_required;
        }

        return new Site(siteInfo);
      })
      .catch(e => {
        console.log('error in fromURL', e);
        return false;
      });
  }

  constructor(props) {
    if (props) {
      Site.FIELDS.forEach(prop => {
        this[prop] = props[prop];
      });

      if (this.icon) {
        this.icon = this.addHttps(this.icon);
      }
    }
    this._timeout = 10000;
  }

  addHttps(url) {
    if (!/^(f|ht)tps?:/i.test(url)) {
      url = 'https:' + url;
    }
    return url;
  }

  jsonApi(path, method, data) {
    console.log(`calling: ${this.url}${path}`);

    method = method || 'GET';
    let headers = {
      'User-Api-Key': this.authToken,
      'User-Agent': `Discourse ${Platform.OS} App / 1.0`,
      'Content-Type': 'application/json',
      'Dont-Chunk': 'true',
      'User-Api-Client-Id': this.clientId || '',
    };

    if (data) {
      data = JSON.stringify(data);
    }

    return new Promise((resolve, reject) => {
      let req = new Request(this.url + path, {
        headers: headers,
        method: method,
        body: data,
      });
      this._currentFetch = fetch(req);
      this._currentFetch
        .then(r1 => {
          if (r1.status === 200) {
            return r1.json();
          } else {
            // if (r1.status === 403) {
            //   this.logoff();
            //   throw 'User was logged off!';
            // } else {
            throw 'Error during fetch status code:' + r1.status;
            // }
          }
        })
        .then(result => {
          resolve(result);
        })
        .catch(e => {
          reject(e);
        })
        .finally(() => {
          this._currentFetch = undefined;
        });
    });
  }

  logoff() {
    this.authToken = null;
    this.username = null;
    this.isStaff = null;
  }

  ensureLatestApi() {
    if (this.apiVersion < 2) {
      this.logoff();
    }

    const timeOffset = 14400 * 1000; // check every 4 hours

    return new Promise((resolve, reject) => {
      if (
        isNaN(this.lastChecked) ||
        Date.now() - this.lastChecked > timeOffset
      ) {
        Site.fromURL(this.url)
          .then(site => {
            console.log('fromUrl request for', this.url);
            resolve(site);
          })
          .catch(e => {
            console.log(e);
            reject('failure');
          });
      } else {
        resolve(this);
      }
    });
  }

  revokeApiKey() {
    return this.jsonApi('/user-api-key/revoke', 'POST');
  }

  isNew(topic) {
    return (
      topic.last_read_post_number === null &&
      ((topic.notification_level !== 0 && !topic.notification_level) ||
        topic.notification_level >= 2)
    );
  }

  isUnread(topic) {
    return (
      topic.last_read_post_number !== null &&
      topic.last_read_post_number < topic.highest_post_number &&
      topic.notification_level >= 2
    );
  }

  updateTotals() {
    let unread = 0;
    let newTopics = 0;

    _.each(this.trackingState, t => {
      if (!t.deleted && t.archetype !== 'private_message') {
        if (this.isNew(t)) {
          newTopics++;
        } else if (this.isUnread(t)) {
          unread++;
        }
      }
    });

    let changed = this.totalUnread !== unread || this.totalNew !== newTopics;

    this.totalUnread = unread;
    this.totalNew = newTopics;
    return changed;
  }

  async refresh(options = {}) {
    if (!this.authToken) {
      return 0;
    }

    const _oldTotal =
      (this.unreadNotifications || 0) +
      (this.unreadPrivateMessages || 0) +
      (this.chatNotifications || 0) +
      (this.flagCount || 0);

    try {
      let totals = await this.jsonApi('/notifications/totals.json');

      // with a chat_notifications key, user has chat enabled
      this.hasChatEnabled = typeof totals.chat_notifications === 'number';

      this.unreadNotifications = totals.unread_notifications || 0;
      this.unreadPrivateMessages = totals.unread_personal_messages || 0;
      this.flagCount = totals.unseen_reviewables || 0;
      this.chatNotifications = totals.chat_notifications || 0;
      this.totalUnread = totals?.topic_tracking.unread || 0;
      this.totalNew = totals?.topic_tracking.new || 0;
      this.username = totals.username;
      if (totals.group_inboxes) {
        this.groupInboxes = totals.group_inboxes;
      }
      if (options.bgTask) {
        return {
          newTotal:
            this.unreadNotifications +
            this.unreadPrivateMessages +
            this.chatNotifications +
            this.flagCount,
          oldTotal: _oldTotal,
          hasPush: this.hasPush,
          url: this.url,
        };
      }
    } catch (error) {
      console.log(
        `${this.url}/notifications/totals.json endpoint not available, exiting.`,
      );
    }
  }

  readNotification(notification) {
    return new Promise((resolve, reject) => {
      this.jsonApi('/notifications/read', 'PUT', {id: notification.id})
        .catch(e => {
          reject(e);
        })
        .finally(() => resolve());
    });
  }

  getSeenNotificationId() {
    return new Promise(resolve => {
      if (!this.authToken) {
        resolve();
        return;
      }

      if (this._seenNotificationId) {
        resolve(this._seenNotificationId);
        return;
      }

      this.notifications().then(() => {
        resolve(this._seenNotificationId);
      });
    });
  }

  notifications(types, options) {
    if (this._loadingNotifications) {
      // avoid double json
      return new Promise(resolve => {
        let retries = 100;
        let interval = setInterval(() => {
          retries--;
          if (retries === 0 || this._notifications) {
            clearInterval(interval);
            this.notifications(types).then(n => {
              resolve(n);
            });
          }
        }, 50);
      });
    }

    return new Promise(resolve => {
      if (!this.authToken) {
        resolve([]);
        return;
      }

      let silent = !(options && options.silent === false);
      // avoid json call when no unread
      silent = silent || this.unreadNotifications === 0;

      if (this._notifications && silent) {
        let filtered = this._notifications;
        let minId = options && options.minId;
        if (types || minId) {
          filtered = _.filter(filtered, notification => {
            // for new always show unread PMs and suppress read
            if (minId) {
              if (notification.read) {
                return false;
              }
              if (!notification.read && notification.notification_type === 6) {
                return true;
              }
              if (!notification.read && notification.notification_type === 24) {
                return true;
              }
            }
            if (minId && minId >= notification.id) {
              return false;
            }
            return !types || _.includes(types, notification.notification_type);
          });
        }
        resolve(filtered);
        return;
      }

      this._loadingNotifications = true;
      this.jsonApi(
        '/notifications.json?recent=true&limit=25' +
          (options && options.silent === false ? '' : '&silent=true'),
      )
        .then(results => {
          this._loadingNotifications = false;
          this._notifications = (results && results.notifications) || [];
          this._seenNotificationId = results && results.seen_notification_id;
          this.notifications(types, _.merge(options, {silent: true})).then(n =>
            resolve(n),
          );
        })
        .catch(e => {
          console.log('failed to fetch notifications ' + e);
          resolve([]);
        })
        .finally(() => {
          this._loadingNotifications = false;
        });
    });
  }

  toJSON() {
    let obj = {};
    Site.FIELDS.forEach(prop => {
      obj[prop] = this[prop];
    });
    return obj;
  }
}

export default Site;
