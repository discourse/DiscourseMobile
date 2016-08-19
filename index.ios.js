/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {
  Component,
  PropTypes
} from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TextInput,
  Image,
  AsyncStorage,
  TouchableOpacity,
  TouchableHighlight,
  Navigator,
  ListView,
  WebView,
  RefreshControl,
  PushNotificationIOS,
  Linking
} from 'react-native';

import Moment from 'moment';
import SafariView from 'react-native-safari-view';
import FetchBlob from 'react-native-fetch-blob';
import SiteRow from './lib/components/site/row';
import RSAKeyPair from 'keypair';
import DeviceInfo from 'react-native-device-info';
import randomBytes from 'react-native-randombytes';
import JSEncrypt from './lib/jsencrypt';

class SiteManager {

  constructor() {
    this._subscribers = [];
    this.sites = [];
    this.load();
    this.ensureRSAKeys();
  }

  add(site) {
    this.sites.push(site);
    this.save();
    this._onChange();
  }

  remove(site) {
    let index = this.sites.indexOf(site);
    if (index >= 0) {
      this.sites.splice(index,1);
      this.save();
      this._onChange()
    }
  }

  subscribe(callback) {
    this._subscribers.push(callback);
  }

  unsubscribe(callback) {
    var pos = this._subscribers.indexOf(callback);
    if (pos >= -1) {
      this._subscribers = this._subscribers.splice(pos,1);
    }
  }

  save() {
    AsyncStorage.setItem('@Discourse.sites', JSON.stringify(this.sites));

    PushNotificationIOS.checkPermissions(p => {
      if (p.badge) {
        PushNotificationIOS.setApplicationIconBadgeNumber(this.totalUnread());
      }
    });
  }

  ensureRSAKeys() {
    AsyncStorage.getItem('@Discourse.rsaKeys').then((json) => {
      if (json) {
        this.rsaKeys = JSON.parse(json);
      } else {
        this.rsaKeys = RSAKeyPair();
        AsyncStorage.setItem('@Discourse.rsaKeys', JSON.stringify(this.rsaKeys));
      }
    });
  }

  load() {
    AsyncStorage.getItem('@Discourse.sites').then((json) => {
      if (json) {
        this.sites = JSON.parse(json).map(obj=>new Site(obj));
        this._onChange()
      }
    });
  }

  totalUnread() {
    let count = 0;
    this.sites.forEach((site)=>{
      if (site.authToken) {
        count += (site.unreadNotifications || 0) + (site.unreadPrivateMessages || 0);
      }
    });
    return count;
  }

  refreshSites(opts) {
    let sites = this.sites.slice(0);
    opts = opts || {};

    return new Promise((resolve,reject)=>{
      if (sites.length === 0) {
        resolve(false);
        return;
      }

      let site = sites.pop();
      let somethingChanged = false;

      let processSite = (site) => {
        site.refreshNotificationCounts(opts).then((changed) => {
          somethingChanged = somethingChanged || changed;
          let s = sites.pop();
          if (s) { processSite(s); }
          else {
            if (somethingChanged) {
              this.save();
            }
            resolve(somethingChanged);
          }
        });
      };

      processSite(site);
    });
  }


  serializeParams(obj) {

    return Object.keys(obj)
                 .map(k => `${encodeURIComponent(k)}=${encodeURIComponent([obj[k]])}`)
                .join("&");
  }

  registerClientId(id) {
    this.getClientId().then(existing => {
      if (existing !== id) {
        this.clientId = id;
        AsyncStorage.setItem('@ClientId', this.clientId);
        this.sites.forEach((site)=>{
          site.authToken = null;
          site.userId = null;
        });
        this.save();
      }
    });
  }

  getClientId() {
    return new Promise(resolve=>{
      if (this.clientId) {
        resolve(this.clientId);
      } else {
        AsyncStorage.getItem('@ClientId').then((clientId)=>{
          if(clientId && clientId.length > 0) {
            this.clientId = clientId;
            resolve(clientId);
          } else {
            randomBytes(32, (err, bytes) => {
              this.clientId = bytes.toString('hex');
              AsyncStorage.setItem('@ClientId', this.clientId);
              resolve(this.clientId);
            });
          }
        });
      }
    });
  }

  generateNonce(site) {
    return new Promise(resolve=>{
      randomBytes(16, (err, bytes) => {
        this._nonce = bytes.toString('hex');
        this._nonceSite = site;
        resolve(this._nonce);
      });
    });
  }

  handleAuthPayload(payload) {
    let crypt = new JSEncrypt();

    crypt.setKey(this.rsaKeys.private);
    let decrypted = JSON.parse(crypt.decrypt(payload));

    if (decrypted.nonce !== this._nonce) {
      alert("We were not expecting this reply, please try again!");
      return;
    }

    this._nonceSite.authToken = decrypted.key;
    this._nonceSite.refreshNotificationCounts()
        .then(()=>{
          this.save();
          this._onChange();
        });

  }

  generateAuthURL(site) {

    let clientId;

    return this.getClientId()
      .then(cid => {
        clientId = cid;
        return this.generateNonce(site);
      })
      .then(nonce => {
         let params = {
          access: 'rp',
          client_id: clientId,
          nonce: nonce,
          push_url: 'https://api.discourse.org/api/ios_notify',
          auth_redirect: 'discourse://auth_redirect',
          application_name: "Discourse - " + DeviceInfo.getDeviceName(),
          public_key: this.rsaKeys.public
        };

        return `${site.url}/user-api-key/new?${this.serializeParams(params)}`;
      });

  }

  _onChange() {
    this._subscribers.forEach((sub) => sub());
  }
}

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
      } else {
        // TODO update unread/new
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
            '/latest': -1,
            '/new': -1,
            '/unread': -1,
            '__seq': 1
          };
          channels[`/notification/${info.userId}`] = -1;

          this.messageBus(channels).then(r => {
            this.processMessages(r);

            this.jsonApi(`/users/${info.username}/topic-tracking-state.json`)
              .then(trackingState => {
                this.trackingState = trackingState;
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

    this.trackingState.forEach(t => {
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

class DiscourseMobile extends Component {

  constructor(props) {
    super(props);
    this._siteManager = new SiteManager();

    this._handleOpenUrl = (event) => {
      let split = event.url.split("payload=");
      if (split.length === 2) {
        this._siteManager.handleAuthPayload(decodeURIComponent(split[1]));
      }
    }

    PushNotificationIOS.addEventListener('register', (s)=>{
      this._siteManager.registerClientId(s);
    });
  }

  componentDidMount() {
    Linking.addEventListener('url', this._handleOpenUrl);
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this._handleOpenUrl);
  }

  openUrl(navigator, site) {
    if (site.authToken) {
      SafariView.show({url: site.url});
      return;
    }

    this._siteManager
      .generateAuthURL(site)
      .then(url => {
        Linking.openURL(url);
      });
  }

  render() {
    PushNotificationIOS.requestPermissions({"alert": true, "badge": true});
    return (
      <HomePage siteManager={this._siteManager}
                onVisitSite={(site)=> this.openUrl(navigator, site)} />

    );
  }
}

class HomePage extends Component {
  static propTypes = {
    onVisitSite: PropTypes.func.isRequired,
    siteManager: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);


    this._dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1.toJSON() !== r2.toJSON()
    });
    this._dataSource = this._dataSource.cloneWithRows(this.props.siteManager.sites);

    this.state = {
      dataSource: this._dataSource,
      isRefreshing: false,
      refreshMessage: ""
    }

    this._onChangeSites = () => this.onChangeSites();
    this.props.siteManager.subscribe(this._onChangeSites);
  }

  componentDidMount() {

    this.refreshSites({ui: false, fast: false});

    this.refresher = setInterval(()=>{
      this.refreshSites({ui: false, fast: true});
    }, 1000*60);
  }

  componentWillUnmount() {
    this.props.siteManager.unsubscribe(this._onChangeSites);
    clearInterval(this.refresher);
  }

  onChangeSites() {
    this._dataSource = this._dataSource.cloneWithRows(this.props.siteManager.sites);
    this.setState({
      dataSource: this._dataSource
    })
  }


  doSearch(term) {
    Site.fromTerm(term)
      .then(site => {
        if (site) {
          this.props.siteManager.add(site);
        }
      });
  }

  refreshSites(opts) {
    if (this.refreshing) { return false; }

    if (opts.ui) {
      this.setState({isRefreshing: true});
    }

    this.props.siteManager.refreshSites({fast: opts.fast})
      .then(()=>{

        this.refreshing = false;

        this.setState({
          isRefreshing: false,
          refreshMessage: "Last updated: " + Moment().format("LT")
        })
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.term}
          placeholder="Add Site"
          returnKeyType="search"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(search) => this.setState({search})}
          onSubmitEditing={()=>this.doSearch(this.state.search)}

        />
        <ListView
          dataSource={this.state.dataSource}
          enableEmptySections={true}
          styles={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={()=>this.refreshSites({ui: true, fast: false})}
              title="Loading..."
            />
          }
          renderRow={(site) =>
            <SiteRow site={site} onClick={()=>this.props.onVisitSite(site)} onDelete={()=>this.props.siteManager.remove(site)}/>
          }
        />
        <Text style={styles.statusLine}>{this.state.refreshMessage}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  term: {
    height: 40,
    paddingLeft: 10,
    marginBottom: 20
  },
  list: {
    flex: 10
  },
  container: {
    flex: 1,
    padding: 10,
    paddingTop: 30,
    justifyContent: 'flex-start',
    backgroundColor: '#FFFAFF',
  },
  statusLine: {
    color: "#777",
    fontSize: 10
  }
});

AppRegistry.registerComponent('DiscourseMobile', () => DiscourseMobile);
