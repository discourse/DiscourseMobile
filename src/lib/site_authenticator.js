import { AsyncStorage, Platform } from "react-native";
import RNKeyPair from "react-native-key-pair";
import DeviceInfo from "react-native-device-info";
import JSEncrypt from "Libs/jsencrypt";
import randomBytes from "Libs/random-bytes";
import Client from "Libs/client";

const RSA_STORAGE_KEY = "@Discourse.rsaKeys";

export default class SiteAuthenticator {
  constructor(site, siteManager) {
    this._rsaKeys = null;
    this._nonce = null;
    this._authenticatedSite = site;
    this._client = new Client();
    this._siteManager = siteManager;
  }

  handleAuthenticationPayload(payload) {
    return new Promise((resolve, reject) => {
      payload = decodeURIComponent(payload);

      this._ensureRSAKeys().then(keys => {
        let crypt = new JSEncrypt();

        crypt.setKey(keys.private);
        const decrypted = JSON.parse(crypt.decrypt(payload));

        if (decrypted.nonce !== this._nonce) {
          reject("We were not expecting this reply, please try again!");
          return;
        }

        this._authenticatedSite.authToken = decrypted.key;
        this._authenticatedSite.hasPush = decrypted.push;
        this._authenticatedSite.apiVersion = decrypted.api;

        this._client.getId().then(id => {
          this._authenticatedSite.clientId = id;
          this._siteManager.save();
          resolve(this._authenticatedSite);
        });
      });
    });
  }

  generateAuthenticationURL() {
    let clientId;

    return this._ensureRSAKeys().then(keys =>
      this._client
        .getId()
        .then(cid => {
          clientId = cid;
          return this._generateNonce();
        })
        .then(nonce => {
          let params = {
            nonce,
            scopes: "notifications,session_info",
            client_id: clientId,
            push_url: `https://api.discourse.org/api/publish_${Platform.OS}`,
            auth_redirect: "discourse://auth_redirect",
            application_name: `Discourse - ${this._deviceName()}`,
            public_key: keys.public
          };

          const authURL = `${
            this._authenticatedSite.url
          }/user-api-key/new?${this._serializeParams(params)}`;

          console.log(`[SITE AUTHENTICATOR] generating auth URL: ${authURL}`);

          return authURL;
        })
    );
  }

  _deviceName() {
    let deviceName = "Unknown Mobile Device";

    try {
      deviceName = DeviceInfo.getDeviceName();
    } catch (e) {
      // on android maybe this can fail?
    }

    return deviceName;
  }

  _ensureRSAKeys() {
    return new Promise((resolve, reject) => {
      if (this._rsaKeys) {
        console.log("[SITE AUTHENTICATOR] get rsa keys from current object");
        resolve(this._rsaKeys);
        return;
      }

      AsyncStorage.getItem(RSA_STORAGE_KEY).then(json => {
        if (json) {
          this._rsaKeys = JSON.parse(json);
          console.log("[SITE AUTHENTICATOR] get rsa keys from storage");
          resolve(this._rsaKeys);
        } else {
          console.log("[SITE AUTHENTICATOR] generating new rsa keys");
          RNKeyPair.generate(pair => {
            this._rsaKeys = pair;

            AsyncStorage.setItem(
              RSA_STORAGE_KEY,
              JSON.stringify(this._rsaKeys)
            ).then(() => {
              console.log("[SITE AUTHENTICATOR] get rsa keys from storage");
              resolve(this._rsaKeys);
            });
          });
        }
      });
    });
  }

  _serializeParams(obj) {
    return Object.keys(obj)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent([obj[k]])}`)
      .join("&");
  }

  _generateNonce() {
    return new Promise(resolve => {
      this._nonce = randomBytes(16);
      resolve(this._nonce);
    });
  }
}
