/**
 * @flow
 */

import React, {
  Component
} from 'react';

import {
  Linking,
  Platform,
  PushNotificationIOS
} from 'react-native';

import SafariView from 'react-native-safari-view';
import HomePage from './components/home/page';
import SiteManager from './site_manager';

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

    if(Platform.OS === 'ios') {
      PushNotificationIOS.addEventListener('register', (s)=>{
        this._siteManager.registerClientId(s);
      });
    }
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
