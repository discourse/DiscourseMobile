import PropTypes from "prop-types";

import React from "react";

import {
  Alert,
  RefreshControl,
  ScrollView,
  View,
  Text,
  SafeAreaView,
  AlertIOS,
  PushNotificationIOS,
  Platform,
  FlatList
} from "react-native";

import { material } from "react-native-typography";
import AddSiteButtonComponent from "Components/add-site-button";
import FirstSiteCardComponent from "Components/first-site-card";
import EditSitesModalComponent from "Components/edit-sites-modal";
import CardComponent from "Components/card";
import EditSitesButtonComponent from "Components/edit-sites-button";
import Site from "Models/site";
import SiteAuthenticator from "Libs/site_authenticator";
import Urlhandler from "Libs/url_handler";
import style from "./stylesheet";
import { DomainError, DupeSite, BadApi } from "Libs/errors";

export default class HubScreen extends React.Component {
  constructor(props) {
    super(props);

    this.siteManager = this.props.siteManager;

    this.urlHandler = new Urlhandler(this.siteManager);

    this.onChangeSitesHandler = e => this.onChangeSites(e);

    this.state = {
      isEditSitesModalVisible: false,
      loadingSites: false,
      sites: []
    };

    if (Platform.OS === "ios") {
      PushNotificationIOS.addEventListener("notification", e => {
        this.urlHandler.open(e._data.discourse_url);
      });

      PushNotificationIOS.addEventListener("register", s => {
        this.siteManager.registerClientId(s);
      });

      PushNotificationIOS.addEventListener("localNotification", e => {
        this.urlHandler.open(e.discourse_url);
      });
    }
  }

  onAddSite(existingInput) {
    AlertIOS.prompt(
      "Enter a forum URL",
      null,
      input => this._addSiteFromInput(input),
      "plain-text",
      existingInput
    );
  }

  onConnect(site) {
    const siteAuthenticator = new SiteAuthenticator(site, this.siteManager);

    siteAuthenticator
      .generateAuthenticationURL(site)
      .then(async authUrl => {
        this.urlHandler
          .openAuthUrl(authUrl)
          .then(url => {
            const split = url.split("payload=");
            if (split.length === 2) {
              siteAuthenticator
                .handleAuthenticationPayload(split[1])
                .then(site => {
                  // // // cause we want to stop rendering connect
                  // this.onChangeSites();
                  // //
                  // site
                  //   .refresh()
                  //   .then(() => {
                  //     this.onChangeSites();
                  //   })

                  // console.log("WILL REFFHSDJSHJDHKSDHKS");
                  this.siteManager.refreshSites({ background: false });
                })
                .catch(error => Alert.alert(error));
            }
          })
          .catch(e => {
            console.log("CATCH", e);
          });
      })
      .catch(e => {
        console.log("CATCH", e);
      });
  }

  componentDidMount() {
    this.siteManager.subscribe(this.onChangeSitesHandler);
    this.onChangeSites();

    PushNotificationIOS.checkPermissions(p => {
      if (p.badge) {
        const total = this.siteManager.totalUnread();
        PushNotificationIOS.setApplicationIconBadgeNumber(total);
      }

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

  render() {
    return (
      <SafeAreaView style={style.container}>
        <EditSitesModalComponent
          siteManager={this.siteManager}
          onClose={this._onEditSites.bind(this)}
          visible={this.state.isEditSitesModalVisible}
        />
        <ScrollView
          style={style.list}
          refreshControl={
            <RefreshControl
              refreshing={this.state.loadingSites}
              onRefresh={this._onRefreshSites.bind(this)}
            />
          }
        >
          <View style={style.header}>
            <Text style={material.display1}>DiscourseHub</Text>
            <AddSiteButtonComponent onPress={this.onAddSite.bind(this)} />
          </View>
          {this._renderFirstSiteCard(this.state.sites.length)}
          {this._renderSites(this.state.sites)}
          {this._renderEditSites(this.state.sites.length)}
        </ScrollView>
      </SafeAreaView>
    );
  }

  openUrl(url) {
    this.urlHandler.open(url);
  }

  _onRefreshSites() {
    this.siteManager.refreshSites({ background: false });
  }

  _onEditSites() {
    this.setState({
      isEditSitesModalVisible: !this.state.isEditSitesModalVisible
    });
  }

  _renderEditSites(sitesLength) {
    if (sitesLength) {
      return (
        <EditSitesButtonComponent onPress={this._onEditSites.bind(this)} />
      );
    }
  }

  _renderSites(sites) {
    return (
      <FlatList
        data={sites}
        extraData={this.state}
        scrollEnabled={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={context => {
          return (
            <CardComponent
              onOpenUrl={this.openUrl.bind(this)}
              onConnect={this.onConnect.bind(this)}
              site={context.item}
              key={`${context.item.url}-${context.index}`}
            />
          );
        }}
      />
    );
  }

  _renderFirstSiteCard(sitesLength) {
    if (!sitesLength) {
      return <FirstSiteCardComponent />;
    }
  }

  _addSiteFromInput(input) {
    Site.fromTerm(input, this.siteManager)
      .then(site => this.siteManager.add(site))
      .catch(e => this._handleRejectedSite(e));
  }

  _handleRejectedSite(exception, input) {
    if (exception instanceof DomainError) {
      Alert.alert(
        "Domain error",
        exception.message,
        [{ text: "OK", onPress: () => this.onAddSite(input) }],
        { cancelable: false }
      );
    }

    if (exception instanceof DupeSite || exception instanceof BadApi) {
      Alert.alert(null, exception.message);
    }
  }
}

HubScreen.propTypes = {
  siteManager: PropTypes.object
};
