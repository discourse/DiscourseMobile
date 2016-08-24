/**
 * @flow
 */

import React, {
  Component
} from 'react';

import {
  Linking,
  Platform,
  PushNotificationIOS,
  AppState
} from 'react-native';

import SiteManager from './site_manager';
import SafariView from 'react-native-safari-view';
import HomePage from './components/home/page';
import BackgroundFetch from 'react-native-background-fetch';

class DiscourseMobile extends Component {

  constructor(props) {
    super(props);
    this._siteManager = new SiteManager();

    this._handleOpenUrl = (event) => {
      console.log("handling incoming url");
      console.log(event);
      let split = event.url.split("payload=");
      if (split.length === 2) {
        this._siteManager.handleAuthPayload(decodeURIComponent(split[1]));
      }
    }

    this._handleAppStateChange = () => {
      console.log("Detected appstate change " + AppState.currentState);

      if (AppState.currentState === "inactive") {
        this._siteManager.enterBackground();
      }

      if (AppState.currentState === "active") {
        this._siteManager.exitBackground();
        this._siteManager.refreshSites({ui: false, fast: true});
      }
    };

    if(Platform.OS === 'ios') {

      PushNotificationIOS.addEventListener('notification', (e) => this._handleRemoteNotification(e));
      PushNotificationIOS.addEventListener('localNotification', (e) => this._handleLocalNotification(e));

      PushNotificationIOS.addEventListener('register', (s)=>{
        this._siteManager.registerClientId(s);
      });

    }
  }

  _handleLocalNotification(e) {
    console.log("got local notification");
    console.log(e);
  }

  _handleRemoteNotification(e) {
    console.log("got remote notification");
    console.log(e);
    if (e._data && e._data.AppState === "inactive" && e._data.discourse_url) {
      console.log("open safari view");
      SafariView.show({url: e._data.discourse_url});
    }

    // TODO if we are active we should try to notify user somehow that a notification
    // just landed .. tricky thing though is that safari view may be showing so we have
    // no way of presenting anything to the user in that case
  }

  componentDidMount() {
    Linking.addEventListener('url', this._handleOpenUrl);
    AppState.addEventListener('change', this._handleAppStateChange);

    if(Platform.OS === 'ios') {
      let doRefresh = () => {

        console.log("Background fetch Called!");

        this._siteManager.refreshSites({ui: false, fast: true, background: true})
          .then((state)=>{

            console.log("Finished refreshing sites in BG fetch!");

            if (state.alerts) {

              console.log("Got " + state.alerts.length + " in BG fetch");

              state.alerts.forEach((a)=>{
                PushNotificationIOS.presentLocalNotification({
                  alertBody: a.excerpt,
                  userInfo: {url: a.url}
                });
              });
            }
          })
        .finally(() => {
          PushNotificationIOS.checkPermissions(p => {
            if (p.badge) {
              let total = this._siteManager.totalUnread();
              console.log("Setting badge to " + total);
              PushNotificationIOS.setApplicationIconBadgeNumber(total);
            }
            console.log("Calling finish on background fetch in 1 second");
            // give it one more second just in case stuff is comitting etc
            setTimeout(BackgroundFetch.finish, 1000);
          });
        });
      };

      BackgroundFetch.configure({stopOnTerminate: false}, ()=>{
        let waited = 0;

        let waitTillDone = ()=> {
          waited++;

          if (this._siteManager.refreshing && waited < 50) {
            // up to 5 seconds to abort
            this.setTimeout(waitTillDone, 100);
          } else if (this._siteManager.refreshing) {
            // something is messed
            console.log("WARNING: forcing a refresh here cause bg is messed up");
            this._siteManager.refreshing = false;
            doRefresh();
          } else {
            doRefresh();
          }
        }

        waitTillDone();

      });
    };
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this._handleOpenUrl);
    AppState.addEventListener('change', this._handleAppStateChange);
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
    if(Platform.OS === 'ios') {
      PushNotificationIOS.requestPermissions({"alert": true, "badge": true});
    }

    return (
      <HomePage
        siteManager={this._siteManager}
        onVisitSite={(site)=> this.openUrl(navigator, site)} />
    );
  }
}

export default DiscourseMobile;
