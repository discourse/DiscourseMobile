/**
 * @flow
 */

import React, {
  Component,
  PropTypes
} from 'react';

import {
  AsyncStorage,
  Platform,
  PushNotificationIOS
} from 'react-native';

import Site from './site';
import RSAKeyPair from 'keypair';
import DeviceInfo from 'react-native-device-info';
import randomBytes from 'react-native-randombytes';
import JSEncrypt from './../lib/jsencrypt';

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

    if(Platform.OS === 'ios') {
      PushNotificationIOS.checkPermissions(p => {
        if (p.badge) {
          PushNotificationIOS.setApplicationIconBadgeNumber(this.totalUnread());
        }
      });
    }
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
        resolve({changed: false});
        return;
      }

      if (opts.ui === false && this._lastRefresh && (new Date() - this._lastRefresh) < 10000) {
        resolve({changed: false});
        return;
      }

      this._lastRefresh = new Date();

      let site = sites.pop();

      if (opts.ui) {
        site.resetBus();
      }

      let somethingChanged = false;
      let alerts = [];

      let processSite = (site) => {
        site.refresh(opts).then((state) => {
          somethingChanged = somethingChanged || state.changed;
          if (state.alerts) {
            alerts = alerts.concat(state.alerts);
          }
          let s = sites.pop();
          if (s) { processSite(s); }
          else {
            if (somethingChanged) {
              this.save();
            }
            this._onRefresh();
            resolve({changed: somethingChanged, alerts: alerts});
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
    this._nonceSite.refresh()
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

  _onRefresh() {
    this._subscribers.forEach((sub) => sub({event: "refresh"}));
  }

  _onChange() {
    this._subscribers.forEach((sub) => sub({event: "change"}));
  }
}

export default SiteManager;
