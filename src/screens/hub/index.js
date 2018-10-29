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
  StatusBar,
  Image,
  TouchableHighlight,
  TouchableOpacity,
  ListView,
  StyleSheet
} from "react-native";

import { material } from "react-native-typography";
import AddSiteButtonComponent from "Components/add-site-button";
import EditSitesModalComponent from "Components/edit-sites-modal";
import CardComponent from "Components/card";
import EditSitesButtonComponent from "Components/edit-sites-button";
import Site from "Models/site";
import SiteAuthenticator from "Libs/site_authenticator";
import Urlhandler from "Libs/url_handler";
import style from "./stylesheet";
import Colors from "Root/colors";
import { DomainError, DupeSite, BadApi } from "Libs/errors";

export default class HubScreen extends React.Component {
  constructor(props) {
    super(props);

    this.siteManager = this.props.siteManager;

    this.urlHandler = new Urlhandler(this.siteManager);

    const dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });

    this.state = {
      appState: AppState.currentState,
      isEditSitesModalVisible: false,
      loadingSites: false,
      sites: this.props.siteManager.sites,
      addedSite: null,
      dataSource,
      suggestedSitesLoaded: false
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

    this._fetchSuggestedSites(suggestedSites);
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
            <AddSiteButtonComponent
              sitesLength={this.state.sites.length}
              onPress={this.onAddSite.bind(this)}
            />
          </View>
          {this._renderAddingSiteIndicator(this.state.addedSite)}
          {this._renderSites(this.state.sites)}
          {this._renderEditSites(this.state.sites.length)}
          {this._renderOnboarding(this.state.sites.length)}
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

  _renderOnboarding(sitesLength) {
    if (sitesLength > 0) {
      return;
    }

    return (
      <ListView
        style={style.list}
        enableEmptySections={true}
        dataSource={this.state.dataSource}
        renderHeader={() => this._renderOnBoardingHeader()}
        renderRow={site => this._renderOnBoardingRow(site)}
      />
    );
  }

  _fetchSuggestedSites(suggestedSites) {
    const sitesFetchPromises = suggestedSites.map(function(url) {
      return fetch(`${url}/site/basic-info.json`)
        .then(response => response.json())
        .then(info => {
          return { info, url };
        });
    });

    Promise.all(sitesFetchPromises)
      .then(responses => {
        return responses.map(response => {
          return new Site({
            url: response.url,
            title: response.info.title,
            description: response.info.description,
            icon: response.info.apple_touch_icon_url
          });
        });
      })
      .then(sites => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(sites),
          suggestedSitesLoaded: true
        });
      })
      .catch(error => console.log(error));
  }

  _renderOnBoardingHeader() {
    return (
      <View style={style.addSiteContainer}>
        <View style={style.addFirstSiteContainer}>
          <Text style={style.text}>
            <Text style={style.title}>You don’t have any sites yet.</Text>
            {"\n"}
            <Text style={style.subtitle}>
              Add Discourse sites to keep track of.
            </Text>
          </Text>

          <TouchableOpacity
            style={style.addSiteButtonWrapper}
            onPress={() => this.onAddSite()}
          >
            <Text style={style.addSiteButtonText}>+ Add your first site</Text>
          </TouchableOpacity>
        </View>

        {this._renderSuggestedSitesIntro()}
      </View>
    );
  }

  _renderOnBoardingRow(site) {
    const lastRow = site.url === suggestedSites[suggestedSites.length - 1];
    let lastRowStyle = {};

    if (lastRow) {
      lastRowStyle.borderBottomColor = Colors.grayBorder;
      lastRowStyle.borderBottomWidth = StyleSheet.hairlineWidth;
    }

    return (
      <TouchableHighlight
        underlayColor={Colors.yellowUIFeedback}
        style={style.rowWrapper}
        onPress={() => this.onAddSite(site.url)}
      >
        <View accessibilityTraits="link" style={[style.row, lastRowStyle]}>
          <Image style={style.icon} source={{ uri: site.icon }} />
          <View style={style.info}>
            <Text ellipsizeMode="tail" numberOfLines={1} style={style.url}>
              {site.url.replace(/^https?:\/\//, "")}
            </Text>
            <Text
              ellipsizeMode="tail"
              numberOfLines={2}
              style={style.description}
            >
              {site.description}
            </Text>
          </View>

          <Text style={style.connect}>+ Add</Text>
        </View>
      </TouchableHighlight>
    );
  }

  _renderSuggestedSitesIntro() {
    if (this.state.suggestedSitesLoaded) {
      return (
        <View style={style.suggestedSitesContainer}>
          <Text style={style.text}>
            <Text style={style.title}>Don’t know where to start?</Text>
            {"\n"}
            <Text style={style.subtitle}>
              Check out these popular communities.
            </Text>
          </Text>
        </View>
      );
    }
  }

  _onRefreshSites() {
    this.siteManager.forceRefreshSites();
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

    if (
      nextAppState.match(/inactive|background/) &&
      this.state.appState === "active"
    ) {
      this.siteManager.sites.forEach(site =>
        site.setState({ isLoading: true })
      );
    }

    this.setState({ appState: nextAppState });
  }
}

const suggestedSites = [
  "https://meta.discourse.org",
  "https://community.cartalk.com",
  "https://community.imgur.com",
  "https://bbs.boingboing.net"
];

HubScreen.propTypes = {
  siteManager: PropTypes.object
};
