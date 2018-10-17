import React from "react";

import {
  Alert,
  ScrollView,
  View,
  Text,
  SafeAreaView,
  AlertIOS,
  Linking,
  StatusBar,
  PushNotificationIOS,
  Platform
} from "react-native";

import { material } from "react-native-typography";
import AddSiteButtonComponent from "../../components/add-site-button";
import FirstSiteCardComponent from "../../components/first-site-card";
import CardComponent from "../../components/card";
import Site from "../../site";
import TopTopic from "../../models/top_topic";
import SiteAuthenticator from "../../site_authenticator";
import ExternalUrlHandler from "../../external_url_handler";
import style from "./stylesheet";
import DiscourseSafariViewManager from "../../../lib/discourse-safari-view-manager";
import { UnexistingSite } from "../../errors";

export default class HubScreen extends React.Component {
  constructor(props) {
    super(props);

    this.siteAuthenticator = null;
    this.siteManager = this.props.siteManager;
    alert(this.siteManager);
    this.test = new ExternalUrlHandler(this.siteManager);

    this.onChangeSitesHandler = e => this.onChangeSites(e);

    this.openURLHandler = event => {
      const split = event.url.split("payload=");

      if (this.siteAuthenticator && split.length === 2) {
        // this.closeBrowser();
        this.siteAuthenticator.handleAuthenticationPayload(split[1]);
      } else {
        this.test.open(event.url).catch(e => {
          console.log("TEST OPEN", e);
          if (e instanceof UnexistingSite) {
            AlertIOS.prompt(
              `The site [${
                event.url
              }] is not added yet, would you want to add it?`,
              null,
              input =>
                Site.fromTerm(input).then(site => {
                  if (site) {
                    if (this.siteManager.exists(site)) {
                      throw "dupe site";
                    }
                    this.siteManager.add(site);
                  }
                })
            );
          }
        });
      }
    };

    this.state = {
      loadingSites: false,
      sites: []
    };

    if (Platform.OS === "ios") {
      PushNotificationIOS.addEventListener("notification", e => {
        // alert(e._data.discourse_url);
        // this._handleRemoteNotification(e)
        this.test.open(e._data.discourse_url);
      });

      PushNotificationIOS.addEventListener("register", s => {
        this.siteManager.registerClientId(s);
      });

      PushNotificationIOS.addEventListener("localNotification", e => {
        alert(e._data.discourse_url);
        this.test.open(e.discourse_url);
      });
    }
  }

  onAddSite() {
    AlertIOS.prompt("Enter a value", null, input =>
      Site.fromTerm(input).then(site => {
        if (site) {
          if (this.siteManager.exists(site)) {
            throw "dupe site";
          }
          this.siteManager.add(site);
        }
      })
    );
  }

  onPressConnect(site) {
    if (site.authToken) {
      this.openUrlsite(site.url, true);
    } else {
      this.siteAuthenticator = new SiteAuthenticator(site, this.siteManager);

      this.siteAuthenticator.generateAuthenticationURL(site).then(async url => {
        this.openUrl(url);
      });
    }
  }

  componentDidMount() {
    Linking.addEventListener("url", this.openURLHandler);
    this.siteManager.subscribe(this.onChangeSitesHandler);
    this.siteManager.refreshInterval(15000);
    this.onChangeSites();

    PushNotificationIOS.checkPermissions(p => {
      // if (p.badge) {
      //   // let total = this._siteManager.totalUnread();
      //   console.log("Setting badge to " + total);
      //   // PushNotificationIOS.setApplicationIconBadgeNumber(total);
      // }
      //
      // console.log("finishing up background fetch");
      // BackgroundFetch.done(true);
    });
  }

  componentWillUnmount() {
    this.siteManager.unsubscribe(this.onChangeSitesHandler);
  }

  onChangeSites(e) {
    if (this.siteManager.isLoading() !== this.state.loadingSites) {
      this.setState({ loadingSites: this.siteManager.isLoading() });
    }

    if (e && e.event === "change") {
      this.setState({ sites: this.siteManager.sites });
    }
  }

  _renderSites(sites) {
    return sites.map((site, index) => {
      return (
        <CardComponent
          onOpenUrl={this.onOpenUrl.bind(this)}
          onPressConnect={this.onPressConnect.bind(this)}
          site={site}
          key={index}
        />
      );
    });
  }

  _renderFirstSiteCard(sitesLength) {
    if (!sitesLength) {
      return <FirstSiteCardComponent />;
    }
  }

  render() {
    return (
      <SafeAreaView style={style.container}>
        <ScrollView style={style.list}>
          <View style={style.header}>
            <Text style={material.display1}>DiscourseHub</Text>
            <AddSiteButtonComponent onPress={this.onAddSite.bind(this)} />
          </View>
          {this._renderFirstSiteCard(this.state.sites.length)}
          {this._renderSites(this.state.sites)}
        </ScrollView>
      </SafeAreaView>
    );
  }

  onOpenUrl(url, token) {
    this.openUrl(url, token);
  }

  async openUrl(url, authToken = false) {
    if (authToken) {
      Linking.openURL(url);

      // this.siteManager.refreshInterval(60000);
    } else {
      let result = await DiscourseSafariViewManager.openAuthSessionAsync(url);

      DiscourseSafariViewManager.dismissBrowser;

      if (result.type === "success") {
        Linking.openURL(result.url);
      } else {
        Alert.alert("Error while authenticating with this Discourse isntance");
      }
    }
  }
}
