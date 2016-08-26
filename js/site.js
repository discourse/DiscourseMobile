'use strict';

/**
 * @flow
 */

import RandomBytesGenerator from './random_bytes_generator';

const fetch = require('./../lib/fetch');

import _ from 'lodash';

class Site {
  static FIELDS = [
    'authToken',
    'title',
    'description',
    'icon',
    'url',
    'unreadNotifications',
    'unreadPrivateMessages',
    'totalUnread',
    'totalNew',
    'userId',
    'username',
    'hasPush'
  ];

  static fromTerm(term) {
    let withProtocol = [];
    let url = "";

    term = term.trim();
    while (term.endsWith("/")) {
      term = term.slice(0, term.length-1);
    }

    if (!term.match(/^https?:\/\//)){
      url = "http://" + term;
    } else {
      url = term;
    }

    return Site.fromURL(url, term);
  }

  static fromURL(url, term) {

    let req = new Request(url + "/user-api-key/new", {
      method: 'HEAD'
    });

    return fetch(req)
      .then((r)=>{
        if (r.status !== 200) {
          alert("Sorry, " + term + " does not support mobile APIs, have owner upgrade Discourse to latest!")
          return;
        }

        // correct url in case we had a redirect
        let split = r.url.split("/")
        url = split[0] + "//" + split[2];

        return fetch(url + "/site/basic-info.json").then(r => r.json());

      })
      .then(info=>{
        return new Site({
          url: url,
          title: info.title,
          description: info.description,
          icon: info.apple_touch_icon_url
        });
      })
      .catch(e=>{
        alert(term + " was not found!")
      });
  }


  constructor(props) {
    if(props) {
      Site.FIELDS.forEach(prop=>{this[prop]=props[prop];});
    }
  }

  jsonApi(path, method, data) {
    console.log("calling: " + this.url + path);

    method = method || 'GET';
    let options = {
      method: method,
      headers: {
        'User-Api-Key': this.authToken,
        'User-Agent': 'Discourse IOS App / 1.0',
        'Content-Type': 'application/json',
        'Dont-Chunk': 'true'
      },
      mode: 'no-cors',
    }

    if (data) {
      options['body'] = JSON.stringify(data);
    }

    if (this._background) {
      return new Promise((resolve, reject) => reject("In background mode aborting start request!"));
    }

    return new Promise((resolve, reject) => {
      fetch(this.url + path, options, this)
      .then(r => {
        if (this._background) {
          throw "In Background mode aborting request!";
        }
        if (r.status === 403) {
          // access denied user logged out or key revoked
          this.authToken = null;
          this.userId = null;
          this.username = null;
          reject("User was logged off!");
        } else if (r.status === 200) {
          r.json().then(r => resolve(r)).catch(e=>{reject(e)});
        } else {
          reject("Failed to make API request Response was " + r.status);
        }
      })
      .catch(e=>{reject(e)}).done();
    });
  }

  getUserInfo() {
    return new Promise((resolve, reject) => {
      if (this.userId && this.username) {
        console.log("we have user id and user name");
        resolve({userId: this.userId, username: this.username});
      } else {
        this.jsonApi("/session/current.json")
          .then(json =>{

            this.userId = json.current_user.id;
            this.username = json.current_user.username;

            resolve({userId: json.current_user.id, username: json.current_user.username});
          })
          .catch(err => {
            reject(err);
          }).done();
      }
    });
  }

  getMessageBusId() {
    return new Promise(resolve => {
      if (this.messageBusId) {
        resolve(this.messageBusId);
      } else {
        RandomBytesGenerator.generateHex(16).then((hex) => {
          this.messageBusId = hex;
          resolve(this.messageBusId);
        }).done();
      }
    });
  }

  messageBus(channels){
    return this.getMessageBusId()
      .then(messageBusId => {
        return this.jsonApi(`/message-bus/${messageBusId}/poll?dlp=t`, 'POST', channels)
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

      console.info("processing incoming message on " + this.url);
      console.log(message);

      if (this.channels) {
        this.channels[message.channel] = message.message_id;
      }

      if (message.channel === "/__status") {
        this.channels = message.data;
        this.channels['__seq'] = 0;
        // we have to get notifications now cause we may have an incorrect number
        rval.notifications = true
      } else if (message.channel === notificationChannel) {

        if (this.unreadNotifications !== message.data.unread_notifications) {
          this.unreadNotifications = message.data.unread_notifications
          rval.notifications = true;
        }

        if (this.unreadPrivateMessages !== message.data.unread_private_messages) {
          this.unreadPrivateMessages = message.data.unread_private_messages
          rval.notifications = true;
        }


      } else if (["/new", "/latest", "/unread/" + this.userId].indexOf(message.channel) > -1) {
        let payload = message.data.payload;
        if (payload.archetype !== "private_message") {
          let existing = this.trackingState["t" + payload.topic_id];
          if (existing) {
            this.trackingState["t" + payload.topic_id] = _.merge(existing, payload);
          } else {
            this.trackingState["t" + payload.topic_id] = payload;
          }
          this.updateTotals();
          rval.totals = true;
        }
      } else if (message.channel === "/recover" || message.channel === "/delete") {
        let existing = this.trackingState["t" + message.data.payload.topic_id];
        if (existing) {
          existing.deleted = (message.channel === "/delete");
        }
      } else if (message.channel === alertChannel) {
        message.data.url = this.url + message.data.post_url;
        message.site = this;
        rval.alerts.push(message.data);
      }
    });

    return rval;
  }

  resetBus() {
    this.userId = null;
    this.username = null;
    this.trackingState = null;
    this.channels = null;
  }

  initBus(){
    return new Promise((resolve,reject) => {
      if (this.channels && this.trackingState) {
        resolve({wasReady: true});
      } else {

        this.getUserInfo()
            .then(info => {

          let channels = {
            '/delete': -1,
            '/recover': -1,
            '/new': -1,
            '/latest': -1,
            '__seq': 1
          };

          channels[`/notification/${info.userId}`] = -1;
          channels[`/notification-alert/${info.userId}`] = -1;
          channels[`/unread/${info.userId}`] = -1;

          this.messageBus(channels).then(r => {
            this.processMessages(r);

            this.jsonApi(`/users/${info.username}/topic-tracking-state.json`)
              .then(trackingState => {
                this.trackingState = {};
                trackingState.forEach(state => {
                  this.trackingState["t" + state.topic_id] = state;
                });
                resolve({wasReady: false});
              })
              .catch(e => {
                console.log("failed to get tracking state " + e);
                reject(e);
              }).done();
          })
          .catch(e => {
            console.log("failed to poll message bus " + e);
            reject(e);
          }).done();

        })
        .catch(e => {
          console.log("get user info failed " + e);
          reject(e);
        }).done();
      }
    });
  }

  isNew(topic) {
    return topic.last_read_post_number === null &&
          ((topic.notification_level !== 0 && !topic.notification_level) ||
          topic.notification_level >= 2);
  }

  isUnread(topic) {
    return topic.last_read_post_number !== null &&
           topic.last_read_post_number < topic.highest_post_number &&
           topic.notification_level >= 2;
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
    console.info(new Date() + " Checking Message Bus on " + this.url);
    // alert("check bus " + this.url + " nid: " + this.channels['/notification/' + this.userId] + " uid:" + this.userId);
    return this.messageBus(this.channels).then(messages => this.processMessages(messages));
  }

  refresh(opts){

    opts = opts || {};

    return new Promise((resolve,reject) => {

      if(!this.authToken) { resolve({changed: false});  return;}

      this.initBus().then((busState) => {

        if (opts.fast || !busState.wasReady) {
          this.checkBus()
              .then(changes => {
                 console.log("changes detected on " + this.url)
                 console.log(changes);

                 if (!busState.wasReady) {
                   this.updateTotals();

                   this.refresh({fast: false})
                       .then(result => {
                         resolve({changed: true, alerts: changes.alerts});
                       })
                       .catch(e => reject(e))
                       .done();

                 } else {
                   resolve({changed: this.updateTotals() || changes.notifications, alerts: changes.alerts});
                 }
              })
              .catch(e => {
                console.log("failed to check bus " + e);
                reject(e);
              });

          return;
        }

        this.jsonApi("/session/current.json")
           .then(json =>{
             let currentUser = json.current_user;

             let changed = (this.userId !== currentUser.id) || (this.username !== currentUser.username);

             changed = changed || this.updateTotals();

             this.userId = currentUser.id;
             this.username = currentUser.username;

             if (this.unreadNotifications !== currentUser.unread_notifications) {
               this.unreadNotifications = currentUser.unread_notifications;
               changed = true;
             }

             if (this.unreadPrivateMessages !== currentUser.unread_private_messages) {
               this.unreadPrivateMessages = currentUser.unread_private_messages;
               changed = true;
             }

             resolve({changed});

            })
            .catch(e=>{
              console.warn(e);
              reject(e);
           });
      })
      .catch(e => {
        reject(e);
      });
    });
  }

  enterBackground() {
    this._background = true;
    fetch.abort(this);
    fetch.setTimeout(5000);
  }

  exitBackground() {
    this._background = false;
    fetch.setTimeout(10000);
  }

  toJSON(){
    let obj = {};
    Site.FIELDS.forEach(prop=>{obj[prop]=this[prop];});
    return obj;
  }
}

export default Site;
