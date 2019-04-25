/* @flow */
"use strict";

import React from "react";
import Immutable from "immutable";

import PropTypes from "prop-types";

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View
} from "react-native";

import { ImmutableListView } from "react-native-immutable-list-view";

import colors from "../../colors";

import Site from "../../site";

class OnBoardingView extends React.Component {
  static propTypes = {
    onDidPressAddSite: PropTypes.func.isRequired,
    onDidPressSuggestedSite: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = { dataSource: [], suggestedSitesLoaded: false };
    this._fetchSuggestedSites(suggestedSites);
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
          dataSource: Immutable.fromJS(sites),
          suggestedSitesLoaded: true
        });
      })
      .catch(error => console.log(error));
  }

  _renderOnBoardingRow(site) {
    const lastRow = site.url === suggestedSites[suggestedSites.length - 1];
    let lastRowStyle = {};

    if (lastRow) {
      lastRowStyle.borderBottomColor = colors.grayBorder;
      lastRowStyle.borderBottomWidth = StyleSheet.hairlineWidth;
    }

    return (
      <TouchableHighlight
        underlayColor={colors.yellowUIFeedback}
        style={[styles.rowWrapper]}
        onPress={() => this.props.onDidPressSuggestedSite(site)}
      >
        <View accessibilityTraits="link" style={[styles.row, lastRowStyle]}>
          <Image style={styles.icon} source={{ uri: site.icon }} />
          <View style={styles.info}>
            <Text ellipsizeMode="tail" numberOfLines={1} style={styles.url}>
              {site.url.replace(/^https?:\/\//, "")}
            </Text>
            <Text
              ellipsizeMode="tail"
              numberOfLines={2}
              style={styles.description}
            >
              {site.description}
            </Text>
          </View>

          <Text style={styles.connect}>+ Add</Text>
        </View>
      </TouchableHighlight>
    );
  }

  _renderSuggestedSitesIntro() {
    if (this.state.suggestedSitesLoaded) {
      return (
        <View style={styles.suggestedSitesContainer}>
          <Text style={styles.text}>
            <Text style={styles.title}>Don’t know where to start?</Text>
            {"\n"}
            <Text style={styles.subtitle}>
              Check out these popular communities.
            </Text>
          </Text>
        </View>
      );
    }
  }

  _renderOnBoardingHeader() {
    return (
      <View style={styles.addSiteContainer}>
        <Text style={styles.text}>
          <Text style={styles.title}>You don’t have any sites yet.</Text>
          {"\n"}
          <Text style={styles.subtitle}>
            Add Discourse sites to keep track of.
          </Text>
        </Text>

        <TouchableOpacity
          style={styles.test}
          onPress={() => this.props.onDidPressAddSite()}
        >
          <Text style={styles.addSiteButtonText}>+ Add your first site</Text>
        </TouchableOpacity>

        {this._renderSuggestedSitesIntro()}
      </View>
    );
  }

  render() {
    if (this.state.dataSource.size > 0) {
      return (
        <ImmutableListView
          style={styles.list}
          enableEmptySections={true}
          immutableData={this.state.dataSource}
          renderHeader={() => this._renderOnBoardingHeader()}
          renderRow={site => this._renderOnBoardingRow(site)}
        />
      );
    }
    return null;
  }
}

const suggestedSites = [
  "https://meta.discourse.org",
  "https://community.cartalk.com",
  // "https://community.imgur.com",
  "https://bbs.boingboing.net"
];

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    padding: 32,
    textAlign: "center"
  },
  addSiteButtonText: {
    backgroundColor: colors.blueCallToAction,
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    padding: 8,
    textAlign: "center"
  },
  title: {
    color: colors.grayTitle,
    fontWeight: "500"
  },
  subtitle: {
    color: colors.graySubtitle
  },
  rowWrapper: {
    marginRight: 16,
    marginLeft: 16
  },
  row: {
    borderLeftColor: colors.grayBorder,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.grayBorder,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.grayBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    padding: 12,
    backgroundColor: "white"
  },
  icon: {
    alignSelf: "center",
    height: 40,
    width: 40
  },
  info: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingLeft: 12
  },
  url: {
    color: colors.grayTitle,
    fontSize: 16,
    fontWeight: "normal"
  },
  description: {
    color: colors.graySubtitle,
    flex: 10,
    fontSize: 14
  },
  connect: {
    alignSelf: "flex-start",
    backgroundColor: colors.blueCallToAction,
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
    marginBottom: 6,
    overflow: "hidden",
    padding: 6
  },
  suggestedSitesContainer: {
    marginTop: 64
  },
  addSiteContainer: {
    marginTop: 32,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column"
  }
});

export default OnBoardingView;
