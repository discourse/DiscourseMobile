import PropTypes from "prop-types";

import React from "react";

import {
  Alert,
  AppState,
  RefreshControl,
  ScrollView,
  View,
  Text,
  SafeAreaView,
  AlertIOS,
  PushNotificationIOS,
  Platform,
  FlatList,
  StatusBar
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

    this.state = {
      appState: AppState.currentState,
      isEditSitesModalVisible: false,
      loadingSites: false,
      sites: this.props.siteManager.sites,
      addedSite: null
    };

    if (Platform.OS === "ios") {
      PushNotificationIOS.addEventListener("notification", e => {
        if (this.state.appState !== "active") {
          this.urlHandler.open(e._data.discourse_url);
        }
      });

      PushNotificationIOS.addEventListener("register", s => {
        this.siteManager.registerClientId(s);
      });

      // PushNotificationIOS.addEventListener("localNotification", e => {
      // });
    }
  }

  onAddSite(existingInput) {
    AlertIOS.prompt(
      "Enter a site URL",
      "eg: meta.discourse.org",
      input => {
        this._addSiteFromInput(input).then(site => {
          this.onConnect(site);
        });
      },
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
                .then(() => {
                  this.siteManager.forceRefreshSites();
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
    AppState.addEventListener("change", this._handleAppStateChange.bind(this));

    PushNotificationIOS.checkPermissions(p => {
      if (p.badge) {
        const total = this.siteManager.totalUnread();
        PushNotificationIOS.setApplicationIconBadgeNumber(total);
      }
    });
  }

  componentWillUnmount() {
    AppState.removeEventListener(
      "change",
      this._handleAppStateChange.bind(this)
    );
  }

  render() {
    return (
      <SafeAreaView style={style.container}>
        <StatusBar backgroundColor="white" barStyle="dark-content" />
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
            <Text style={[material.display1, style.title]}>Discourse Hub</Text>
            <AddSiteButtonComponent onPress={this.onAddSite.bind(this)} />
          </View>
          {this._renderAddingSiteIndicator(this.state.addedSite)}
          {this._renderFirstSiteCard(this.state.sites.length)}
          {this._renderSites(this.state.sites)}
          {this._renderEditSites(this.state.sites.length)}
        </ScrollView>
      </SafeAreaView>
    );
  }

  openUrl(url, options = {}) {
    this.urlHandler.open(url).then(e => {
      if (e && e.event && e.event === "success") {
        this.siteManager.siteForUrl(url).then(site => {
          site.shouldRefreshOnEnterForeground = false;
        });
      }

      if (e && e.event && e.event === "closing") {
        this.siteManager.refreshStalledSites({ fast: true });
      }
    });
  }

  _onRefreshSites() {
    this.siteManager.forceRefreshSites({ fast: true });
  }

  _onEditSites() {
    this.setState({
      isEditSitesModalVisible: !this.state.isEditSitesModalVisible
    });
  }

  _renderAddingSiteIndicator(addedSite) {
    if (addedSite) {
      const text = `Adding ${addedSite}...`;
      return (
        <View style={style.addingSiteContainer}>
          <Text style={style.addingSiteText}>{text}</Text>
        </View>
      );
    }
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
    if (!sitesLength && !this.state.addedSite) {
      return <FirstSiteCardComponent onPress={this.onAddSite.bind(this)} />;
    }
  }

  _addSiteFromInput(input) {
    this.setState({ addedSite: input });

    return new Promise(resolve => {
      Site.fromTerm(input, this.siteManager)
        .then(site => {
          this.siteManager.add(site);
          resolve(site);
        })
        .catch(e => {
          this._handleRejectedSite(e, input);
        })
        .finally(() => this.setState({ addedSite: null }))
        .done();
    });
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

  _handleAppStateChange(nextAppState) {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      this.siteManager.refreshStalledSites({ fast: true });
    }

    this.setState({ appState: nextAppState });
  }
}

HubScreen.propTypes = {
  siteManager: PropTypes.object
};
