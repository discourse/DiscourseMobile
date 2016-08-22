/**
 * @flow
 */

import randomBytes from 'react-native-randombytes';
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
    'username'
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

        return fetch(url + "/site/basic-info.json")
                 .then(r => r.json());

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
    //console.log("calling: " + path);

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

    return fetch(this.url + path, options).then(r => {
      if (r.status === 403) {
        // access denied user logged out or key revoked
        this.authToken = null;
        this.userId = null;
        this.username = null;
        return {current_user: {}};
      }
      return r.json();
    })
  }

  getUserInfo() {
    return new Promise(resolve => {
      if (this.userId && this.username) {
        resolve({userId: this.userId, username: this.username});
      } else {

        this.jsonApi("/session/current.json")
          .then(json =>{
            resolve({userId: json.current_user.id, username: json.current_user.username});
          });
      }
    });
  }

  getMessageBusId() {
    return new Promise(resolve => {
      if (this.messageBusId) {
        resolve(this.messageBusId);
      } else {
        randomBytes(16, (err, bytes) => {
          this.messageBusId = bytes.toString('hex');
          resolve(this.messageBusId);
        });
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
      totals: false
    };

    let notificationChannel = `/notification/${this.userId}`;

    messages.forEach(message => {

      if (this.channels) {
        this.channels[message.channel] = message.message_id;
      }

      if (message.channel === "/__status") {
        this.channels = message.data;
        this.channels['__seq'] = 0;
      } else if (message.channel === notificationChannel) {
        rval.notifications = true;
      } else if (["/new", "/latest", "/unread/" + this.userId].indexOf(message.channel) > -1) {
        let payload = message.data.payload;
        if (payload.archetype !== "private_message") {
          this.trackingState["t" + payload.topic_id] = payload;
          this.updateTotals();
          rval.totals = true;
        }
      } else if (message.channel === "/recover" || message.channel === "/delete") {
        let existing = this.trackingState["t" + message.data.payload.topic_id];
        if (existing) {
          existing.deleted = (message.channel === "/delete");
        }
      } else if (message.channel === "/delete") {
      } else {
        console.log(message);
      }
    });

    return rval;
  }

  initBus(){
    return new Promise(resolve => {
      if (this.channels) {
        resolve();
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
          channels[`/unread/${info.userId}`] = -1;

          this.messageBus(channels).then(r => {
            this.processMessages(r);

            this.jsonApi(`/users/${info.username}/topic-tracking-state.json`)
              .then(trackingState => {
                this.trackingState = {};
                trackingState.forEach(state => {
                  this.trackingState["t" + state.topic_id] = state;
                });
                resolve();
              });
          });

        });

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
    return this.messageBus(this.channels).then(messages => this.processMessages(messages));
  }

  refreshNotificationCounts(opts){

    opts = opts || {};

    return new Promise((resolve,reject) => {

      if(!this.authToken) { resolve(false);  return;}

      this.initBus().then(() => {

        if (opts.fast) {
          this.checkBus()
              .then(changes => {
                 if (changes.notifications) {
                   this.refreshNotificationCounts({fast: false}).then(result => resolve(result));
                 } else {
                   resolve(this.updateTotals());
                 }
              });

          return;
        }

        this.jsonApi("/session/current.json")
           .then(json =>{
             currentUser = json.current_user;

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

             resolve(changed);

            }).catch(e=>{
             console.warn(e);
             resolve(false);
           });
      });
    });
  }

  toJSON(){
    let obj = {};
    Site.FIELDS.forEach(prop=>{obj[prop]=this[prop];});
    return obj;
  }
}

export default Site;
