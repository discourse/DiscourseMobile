/* @flow */
'use strict';

import {AppState, Platform} from 'react-native';
import _ from 'lodash';
import Moment from 'moment';
import DiscourseUtils from './DiscourseUtils';

const fetch = require('./../lib/fetch');
import randomBytes from './../lib/random-bytes';

class Site {
  static FIELDS = [
    'authToken',
    'title',
    'description',
    'icon',
    'url',
    'unreadNotifications',
    'unreadPrivateMessages',
    'lastSeenNotificationId',
    'flagCount',
    'queueCount',
    'totalUnread',
    'totalNew',
    'userId',
    'username',
    'hasPush',
    'isStaff',
    'apiVersion',
    'lastChecked',
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
        return new Site({
          url: url,
          title: info.title,
          description: info.description,
          icon: info.apple_touch_icon_url,
          apiVersion: apiVersion,
        });
      });
  }

  constructor(props) {
    if (props) {
      Site.FIELDS.forEach(prop => {
        this[prop] = props[prop];
      });

      if (this.icon) {
        this.icon = this.addhttps(this.icon);
      }
    }
    this._timeout = 10000;
  }

  addhttps(url) {
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
        })
        .done();
    });
  }

  logoff() {
    this.authToken = null;
    this.userId = null;
    this.username = null;
    this.isStaff = null;
  }

  ensureLatestApi() {
    if (this.apiVersion < 2) {
      this.logoff();
    }

    var timeOffset = new Moment().subtract(1, 'hours').format();

    return new Promise((resolve, reject) => {
      if (!this.lastChecked || Moment(this.lastChecked).isBefore(timeOffset)) {
        Site.fromURL(this.url)
          .then(site => {
            console.log('fromUrl request for', this.url);
            resolve(site);
          })
          .catch(e => {
            console.log(e);
            reject('failure');
          })
          .done();
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

  async refresh() {
    if (!this.authToken) {
      return;
    }

    let json = await this.jsonApi('/session/current.json');
    let currentUser = json.current_user;
    this.isStaff = !!(currentUser.admin || currentUser.moderator);

    // in case of old API fallback
    this._seenNotificationId =
      currentUser.seen_notification_id || this._seenNotificationId;

    this.unreadNotifications = currentUser.unread_notifications;

    if (currentUser.unread_high_priority_notifications) {
      this.unreadPrivateMessages =
        currentUser.unread_high_priority_notifications;
    } else {
      this.unreadPrivateMessages = currentUser.unread_private_messages;
    }

    if (this.isStaff) {
      this.flagCount = currentUser.reviewable_count;
    }

    this.trackingState = {};
    let tS = await this.jsonApi(
      `/users/${json.current_user.username}/topic-tracking-state.json`,
    );
    tS.forEach(state => {
      this.trackingState[`t${state.topic_id}`] = state;
    });
    this.updateTotals();
    return;
  }

  readNotification(notification) {
    return new Promise((resolve, reject) => {
      this.jsonApi('/notifications/read', 'PUT', {id: notification.id})
        .catch(e => {
          reject(e);
        })
        .finally(() => resolve)
        .done();
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
            this.notifications(types)
              .then(n => {
                resolve(n);
              })
              .done();
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
          this.notifications(types, _.merge(options, {silent: true}))
            .then(n => resolve(n))
            .done();
        })
        .catch(e => {
          console.log('failed to fetch notifications ' + e);
          resolve([]);
        })
        .finally(() => {
          this._loadingNotifications = false;
        })
        .done();
    });
  }

  getAlerts() {
    const alertifiable = [1, 2, 3, 6, 7];
    const types = {
      1: 'mentioned you in',
      2: 'replied to',
      3: 'quoted you in',
      6: 'messaged you in',
      7: 'invited you to',
    };

    return new Promise((resolve, reject) => {
      this.jsonApi('/notifications.json?recent=true&limit=25')
        .then(results => {
          const unreadAlerts = [];
          if (results.notifications) {
            results.notifications.forEach(r => {
              let excerpt = '';
              if (!r.read && alertifiable.indexOf(r.notification_type) > -1) {
                if (r.data.display_username.match(/\sreplies/)) {
                  excerpt = `${r.data.display_username} to "${r.fancy_title}"`;
                } else {
                  excerpt = `@${r.data.display_username} ${
                    types[r.notification_type]
                  } "${r.fancy_title}"`;
                }
                let url = DiscourseUtils.endpointForSiteNotification(this, r);
                unreadAlerts.push({
                  excerpt: excerpt,
                  url: url,
                  id: r.id,
                });
              }
            });
            resolve(unreadAlerts);
          }
        })
        .catch(e => {
          console.log('failed to fetch notifications ' + e);
          resolve({});
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
