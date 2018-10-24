import _ from "lodash";

const fetch = require("Libs/fetch");
import randomBytes from "Libs/random-bytes";
import { DomainError, DupeSite, BadApi, UnknownError } from "Libs/errors";
import TopTopic from "Models/top_topic";
import Api from "Libs/api";

class Site {
  static FIELDS = [
    "authToken",
    "title",
    "description",
    "icon",
    "url",
    "unreadNotifications",
    "unreadPrivateMessages",
    "lastSeenNotificationId",
    "flagCount",
    "queueCount",
    "totalUnread",
    "totalNew",
    "userId",
    "username",
    "hasPush",
    "isStaff",
    "apiVersion",
    "topics",
    "headerBackgroundColor",
    "headerPrimaryColor"
  ];

  static fromTerm(term, siteManager) {
    let url = "";

    term = term.trim();
    while (term.endsWith("/")) {
      term = term.slice(0, term.length - 1);
    }

    if (!term.match(/^https?:\/\//)) {
      url = `http://${term}`;
    } else {
      url = term;
    }

    return Site.fromURL(url, term, siteManager);
  }

  static fromURL(url, term, siteManager) {
    let req = new Request(`${url}/user-api-key/new`, {
      method: "HEAD"
    });

    return fetch(req)
      .then(userApiKeyResponse => {
        if (userApiKeyResponse.status === 404) {
          throw new BadApi();
        }

        if (userApiKeyResponse.status !== 200) {
          throw new DomainError();
        }

        let version = userApiKeyResponse.headers.get("Auth-Api-Version");
        if (parseInt(version, 10) < 2) {
          throw new BadApi();
        }

        // make sure we use the correct URL, eg: a URL could lead us to
        // the correct destination after a redirect, we want to store the
        // final destination and not the origin
        // we also replace any trailing slash
        url = userApiKeyResponse.url
          .replace("/user-api-key/new", "")
          .replace(/\/+$/, "")
          .replace(/:\d+/, "");

        return fetch(`${url}/site/basic-info.json`).then(basicInfoResponse =>
          basicInfoResponse.json()
        );
      })
      .then(info => {
        const site = new Site({
          url,
          title: info.title,
          description: info.description,
          icon: info.apple_touch_icon_url,
          headerBackgroundColor: `#${info.header_background_color}`,
          headerPrimaryColor: `#${info.header_primary_color}`
        });

        if (site) {
          if (siteManager.exists(site)) {
            throw new DupeSite();
          } else {
            return site;
          }
        } else {
          throw new UnknownError();
        }
      })
      .catch(e => {
        if (e instanceof TypeError && e.message === "Network request failed") {
          throw new DomainError();
        } else {
          throw e;
        }
      });
  }

  constructor(props) {
    if (props) {
      Site.FIELDS.forEach(prop => {
        this[prop] = props[prop];
      });
    }
    this._timeout = 10000;

    this.topics = [];
    this.shouldRefreshOnEnterForeground = false;
    this.apiClient = new Api(this);

    this.state = {
      isLoading: false
    };

    this._subscribers = [];
  }

  subscribe(callback) {
    this._subscribers.push(callback);
  }

  unsubscribe(callback) {
    const pos = this._subscribers.indexOf(callback);
    if (pos >= -1) {
      this._subscribers.splice(pos, 1);
    }
  }

  dispatchState() {
    console.log(`[SITE] Dispatch state to ${this.url}`, this.state);

    this._subscribers.forEach(sub => sub(this.state));
  }

  loadTopics(lists = []) {
    // this. = true;

    if (this.totalNew) {
      lists.push("new");
    }
    if (this.totalUnread) {
      lists.push("unread");
    }
    if (!lists.length) {
      lists.push("latest");
    }

    return TopTopic.startTracking(this, lists)
      .then(topics => {
        this.topics = topics.slice(0, 20);
      })
      .finally(() => {
        this.setState({ isLoading: false });
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
  }

  revokeApiKey() {
    return this.apiClient.fetch("/user-api-key/revoke", "POST");
  }

  getUserInfo() {
    return new Promise((resolve, reject) => {
      if (this.userId && this.username) {
        resolve({
          userId: this.userId,
          username: this.username,
          isStaff: this.isStaff
        });
      } else {
        this.apiClient
          .fetch("/session/current.json")
          .then(json => {
            this.userId = json.current_user.id;
            this.username = json.current_user.username;
            this.isStaff = !!(
              json.current_user.admin || json.current_user.moderator
            );

            resolve({
              userId: this.userId,
              username: this.username,
              isStaff: this.isStaff
            });
          })
          .catch(err => reject(err))
          .done();
      }
    });
  }

  getMessageBusId() {
    return new Promise(resolve => {
      if (this.messageBusId) {
        resolve(this.messageBusId);
      } else {
        this.messageBusId = randomBytes(16);
        resolve(this.messageBusId);
      }
    });
  }

  messageBus(channels) {
    return this.getMessageBusId().then(messageBusId => {
      return this.apiClient.fetch(
        `/message-bus/${messageBusId}/poll?dlp=t`,
        "POST",
        channels
      );
    });
  }

  processMessages(messages) {
    let rval = {
      notifications: false,
      totals: false,
      alerts: []
    };

    let notificationChannel = `/notification/${this.userId}`;
    let alertChannel = `/notification-alert/${this.userId}`;

    messages.forEach(message => {
      if (this.channels) {
        this.channels[message.channel] = message.message_id;
      }

      if (message.channel === "/__status") {
        this.channels = message.data;
        this.channels.__seq = 0;
        // we have to get notifications now cause we may have an incorrect number
        rval.notifications = true;
      } else if (message.channel === notificationChannel) {
        this._seenNotificationId = message.data.seen_notification_id;

        // force a refresh on next open
        if (this._notifications) {
          // compare most recent notifications
          let newData = message.data.recent;

          let existing = _.chain(this._notifications)
            .take(newData.length)
            .map(n => [n.id, n.read])
            .value();

          let changed = !_.isEqual(newData, existing);
          if (changed) {
            this._notifications = null;
            rval.notifications = true;
          }
        }

        if (this.unreadNotifications !== message.data.unread_notifications) {
          this.unreadNotifications = message.data.unread_notifications;
          rval.notifications = true;
        }

        if (
          this.unreadPrivateMessages !== message.data.unread_private_messages
        ) {
          this.unreadPrivateMessages = message.data.unread_private_messages;
          rval.notifications = true;
        }
      } else if (
        ["/new", "/latest", "/unread/" + this.userId].indexOf(message.channel) >
        -1
      ) {
        let payload = message.data.payload;
        if (payload.archetype !== "private_message") {
          let existing = this.trackingState["t" + payload.topic_id];
          if (existing) {
            this.trackingState["t" + payload.topic_id] = _.merge(
              existing,
              payload
            );
          } else {
            this.trackingState["t" + payload.topic_id] = payload;
          }
          this.updateTotals();
          rval.totals = true;
        }
      } else if (
        message.channel === "/recover" ||
        message.channel === "/delete"
      ) {
        let existing = this.trackingState["t" + message.data.payload.topic_id];
        if (existing) {
          existing.deleted = message.channel === "/delete";
        }
      } else if (message.channel === "/flagged_counts") {
        if (this.flagCount !== message.data.total) {
          this.flagCount = message.data.total;
          rval.notifications = true;
        }
      } else if (message.channel === "/queue_counts") {
        if (this.queueCount !== message.data.post_queue_new_count) {
          // yes this is weird, we have some real coupled code here
          this.flagCount -=
            (this.queueCount || 0) - message.data.post_queue_new_count;
          this.queueCount = message.data.post_queue_new_count;
          rval.notifications = true;
        }
      } else if (message.channel === alertChannel) {
        message.data.url = this.url + message.data.post_url;
        message.data.site = this;
        rval.alerts.push(message.data);
      }
    });

    return rval;
  }

  resetBus() {
    this.userId = null;
    this.username = null;
    this.isStaff = null;
    this.trackingState = null;
    this.channels = null;
  }

  initBus() {
    return new Promise((resolve, reject) => {
      if (this.channels && this.trackingState) {
        resolve({ wasReady: true });
      } else {
        this.getUserInfo()
          .then(info => {
            let channels = {
              "/delete": -1,
              "/recover": -1,
              "/new": -1,
              "/latest": -1,
              __seq: 1
            };

            channels[`/notification/${info.userId}`] = -1;
            channels[`/notification-alert/${info.userId}`] = -1;
            channels[`/unread/${info.userId}`] = -1;

            if (info.isStaff) {
              channels["/queue_counts"] = -1;
              channels["/flagged_counts"] = -1;
            }

            this.messageBus(channels)
              .then(r => {
                this.processMessages(r);
                this.apiClient
                  .fetch(`/users/${info.username}/topic-tracking-state.json`)
                  .then(trackingState => {
                    this.trackingState = {};
                    trackingState.forEach(state => {
                      this.trackingState[`t${state.topic_id}`] = state;
                    });
                    resolve({ wasReady: false });
                  })
                  .catch(e => {
                    console.log("failed to get tracking state " + e);
                    reject(e);
                  })
                  .done();
              })
              .catch(e => {
                resolve({ wasReady: false });
              })
              .done();
          })
          .catch(e => {
            console.log(`get user info failed ${e}`);
            reject(e);
          })
          .done();
      }
    });
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
      if (!t.deleted && t.archetype !== "private_message") {
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

  checkBus() {
    return this.messageBus(this.channels).then(messages =>
      this.processMessages(messages)
    );
  }

  setState(state) {
    Object.assign(this.state, state);
    this.dispatchState();
  }

  refresh(opts) {
    opts = opts || {};

    this.setState({ isLoading: true });

    const stateAfterRefresh = (state, alerts) => {
      alerts = alerts = [];
      state = state || false;
      return { site: this, changed: state, alerts };
    };

    return new Promise((resolve, reject) => {
      if (!this.authToken) {
        resolve(stateAfterRefresh());
        return;
      }

      this.initBus()
        .then(busState => {
          if (opts.fast || !busState.wasReady) {
            this.checkBus()
              .then(changes => {
                if (!busState.wasReady) {
                  this.updateTotals();

                  this.refresh({ fast: false })
                    .then(result => {
                      resolve(stateAfterRefresh(true, changes.alerts));
                    })
                    .catch(e => reject(e))
                    .done();
                } else {
                  resolve(
                    stateAfterRefresh(
                      this.updateTotals() ||
                        changes.notifications ||
                        changes.totals,
                      changes.alerts
                    )
                  );
                }
              })
              .catch(e => {
                console.log(`failed to check bus ${e}`);
                resolve(stateAfterRefresh(false));
              });

            return;
          }

          this.apiClient
            .fetch("/session/current.json")
            .then(json => {
              let currentUser = json.current_user;

              let changed =
                this.userId !== currentUser.id ||
                this.username !== currentUser.username ||
                this.isStaff !== !!(currentUser.admin || currentUser.moderator);

              changed = changed || this.updateTotals();

              this.userId = currentUser.id;
              this.username = currentUser.username;
              this.isStaff = !!(currentUser.admin || currentUser.moderator);

              // in case of old API fallback
              this._seenNotificationId =
                currentUser.seen_notification_id || this._seenNotificationId;

              if (
                this.unreadNotifications !== currentUser.unread_notifications
              ) {
                this.unreadNotifications = currentUser.unread_notifications;
                changed = true;
              }

              if (
                this.unreadPrivateMessages !==
                currentUser.unread_private_messages
              ) {
                this.unreadPrivateMessages =
                  currentUser.unread_private_messages;
                changed = true;
              }

              if (this.isStaff) {
                let newFlagCount = currentUser.post_queue_new_count;
                if (newFlagCount !== this.flagCount) {
                  this.flagCount = newFlagCount;
                  changed = true;
                }

                let newQueueCount = currentUser.post_queue_new_count;
                if (newQueueCount !== this.queueCount) {
                  this.queueCount = newQueueCount;
                  changed = true;
                }
              }

              resolve(stateAfterRefresh(changed));
            })
            .catch(e => resolve(stateAfterRefresh()));
        })
        .catch(e => resolve(stateAfterRefresh()));
    });
  }

  enterBackground() {
    this._background = true;
    if (this._currentFetch && this._currentFetch.abort) {
      this._currentFetch.abort();
    }
    this._timeout = 5000;
  }

  exitBackground() {
    this._background = false;
    this._timeout = 10000;
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
