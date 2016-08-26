/* @flow */
'use strict'

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
import RandomBytesGenerator from './utils/random_bytes_generator';
import JSEncrypt from './../lib/jsencrypt';
import _ from 'lodash';

class SiteManager {
  constructor() {
    this._subscribers = [];
    this.sites = [];
    this.load();

    AsyncStorage.getItem('@Discourse.lastRefresh').then(date => {
      if (date) {
        this._onRefresh(new Date(date));
      }
    });

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

  updateUnreadBadge() {
    if(Platform.OS === 'ios') {
      PushNotificationIOS.checkPermissions(p => {
        if (p.badge) {
          PushNotificationIOS.setApplicationIconBadgeNumber(this.totalUnread());
        }
      });
    }
  }

  save() {
    AsyncStorage.setItem('@Discourse.sites', JSON.stringify(this.sites)).done();
    this.updateUnreadBadge();
  }

  ensureRSAKeys() {
    AsyncStorage.getItem('@Discourse.rsaKeys').then((json) => {
      if (json) {
        this.rsaKeys = JSON.parse(json);
      } else {
        console.log("Generating RSA keys");
        this.rsaKeys = RSAKeyPair();
        console.log("Generated RSA keys");
        AsyncStorage.setItem('@Discourse.rsaKeys', JSON.stringify(this.rsaKeys));
      }
    });
  }

  load() {
    AsyncStorage.getItem('@Discourse.sites').then((json) => {
      if (json) {
        this.sites = JSON.parse(json).map(obj=>new Site(obj));
        this._onChange();
        this.refreshSites({ui: false, fast: true}).then(()=>{
          this._onChange();
        }).done();
      }
    }).done();
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

  enterBackground() {
    this._background = true;
    this.sites.forEach(s=>s.enterBackground());
  }

  exitBackground() {
    this._background = false;
    this.sites.forEach(s=>s.exitBackground());
  }

  refreshSites(opts) {
    let sites = this.sites.slice(0);
    opts = opts || {};

    let bgRefresh = opts.background === true;

    console.log("refresh sites was called on " + sites.length + " sites!");

    return new Promise((resolve,reject)=>{

      if (this._background && !opts.background) {
        console.log("skip refresh cause app is in background!");
        resolve({changed: false});
        return;
      }

      if (sites.length === 0) {
        console.log("no sites defined nothing to refresh!");
        resolve({changed: false});
        return;
      }

      let refreshDelta = this._lastRefreshStart && (new Date() - this._lastRefreshStart);

      if (opts.ui === false && this._lastRefreshStart && refreshDelta < 10000) {
        console.log("bg refresh skipped cause it is already running!");
        resolve({changed: false});
        return;
      }

      if (this.refreshing && refreshDelta < 60000) {
        console.log("not refreshing cause already refreshing!");
        resolve({changed: false});
        return;
      }

      if (this.refreshing && refreshDelta >= 60000) {
        console.log("WARNING: a previous refresh went missing, resetting cause 1 minute is too long");
      }

      this.refreshing = true;
      this._lastRefreshStart = new Date();

      let processedSites = 0;
      let somethingChanged = false;
      let alerts = [];

      sites.forEach(site => {

        if (opts.ui) {
          site.resetBus();
        }

        if (opts.background) {
          site.exitBackground();
        }

        site.refresh(opts)
            .then((state) => {

              somethingChanged = somethingChanged || state.changed;
              if (state.alerts) {
                alerts = alerts.concat(state.alerts);
              }
            })
            .catch((e)=>{
              console.log("failed to refresh " + site.url);
              console.log(e);
              // maybe we were logged out ... something is odd
              somethingChanged = true;
            })
            .finally(() => {

              if (this._background) {
                site.enterBackground();
              }

              processedSites++;

              if (processedSites === sites.length) {
                if (somethingChanged) {
                  this.save();
                }
                this.lastRefresh = new Date();
                AsyncStorage.setItem("@Discourse.lastRefresh", this.lastRefresh.toJSON()).done();
                this._onRefresh();
                this.refreshing = false;
                resolve({changed: somethingChanged, alerts: alerts});
              }
            })
            .done();

      });

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
            RandomBytesGenerator.generateHex(32).then((hex) => {
              this.clientId = hex;
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
      RandomBytesGenerator.generateHex(16).then((hex) => {
        this._nonce = hex;
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
    this._nonceSite.hasPush = decrypted.access.indexOf("p") > -1;

    this._nonceSite.refresh()
        .then(()=>{
          this._onChange();
        })
        .catch((e)=>{
          console.log("Failed to refresh " + this._nonceSite.url  + " " + e);
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
        let deviceName = "Unknown Mobile Device";

        try {
          deviceName = DeviceInfo.getDeviceName();
        } catch(e){
          // on android maybe this can fail?
        }

        let params = {
          access: 'rp',
          client_id: clientId,
          nonce: nonce,
          push_url: 'https://api.discourse.org/api/publish_ios',
          auth_redirect: 'discourse://auth_redirect',
          application_name: "Discourse - " + deviceName,
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
