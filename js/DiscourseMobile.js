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
      let split = event.url.split("payload=");
      if (split.length === 2) {
        this._siteManager.handleAuthPayload(decodeURIComponent(split[1]));
      }
    }

    this._handleAppStateChange = () => {
      if (AppState.currentState === "active") {
        this._siteManager.refreshSites({ui: false, fast: true}).then(()=>{});
      }
    };

    if(Platform.OS === 'ios') {
      PushNotificationIOS.addEventListener('register', (s)=>{
        this._siteManager.registerClientId(s);
      });

    }
  }

  componentDidMount() {
    Linking.addEventListener('url', this._handleOpenUrl);
    AppState.addEventListener('change', this._handleAppStateChange);


    BackgroundFetch.configure({stopOnTerminate: false}, () => {

      console.log("Background fetch Called!");

      this._siteManager.refreshSites({ui: false, fast: true})
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

          BackgroundFetch.finish();
        });
    });
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
