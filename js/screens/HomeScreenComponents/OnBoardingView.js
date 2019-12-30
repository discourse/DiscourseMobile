/* @flow */
'use strict';

const suggestedSites = [
  'https://meta.discourse.org',
  'https://community.cartalk.com',
  // "https://community.imgur.com",
  'https://bbs.boingboing.net',
];

import React from 'react';
import Immutable from 'immutable';

import PropTypes from 'prop-types';

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View,
} from 'react-native';

import {ImmutableVirtualizedList} from 'react-native-immutable-list-view';

import Site from '../../site';
import {ThemeContext} from '../../ThemeContext';

class OnBoardingView extends React.Component {
  static propTypes = {
    onDidPressAddSite: PropTypes.func.isRequired,
    onDidPressSuggestedSite: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {dataSource: [], suggestedSitesLoaded: false};
    this._fetchSuggestedSites(suggestedSites);
  }

  _fetchSuggestedSites(suggestedSites) {
    const sitesFetchPromises = suggestedSites.map(function(url) {
      return fetch(`${url}/site/basic-info.json`)
        .then(response => response.json())
        .then(info => {
          return {info, url};
        });
    });

    Promise.all(sitesFetchPromises)
      .then(responses => {
        return responses.map(response => {
          return new Site({
            url: response.url,
            title: response.info.title,
            description: response.info.description,
            icon: response.info.apple_touch_icon_url,
          });
        });
      })
      .then(sites => {
        this.setState({
          dataSource: Immutable.fromJS(sites),
          suggestedSitesLoaded: true,
        });
      })
      .catch(error => console.log(error));
  }

  _renderOnBoardingRow(item) {
    const theme = this.context;
    const site = item.item;
    const lastRow = site.url === suggestedSites[suggestedSites.length - 1];
    let lastRowStyle = {};
    if (lastRow) {
      lastRowStyle.borderBottomColor = theme.grayBorder;
      lastRowStyle.borderBottomWidth = StyleSheet.hairlineWidth;
    }

    const rowColors = {
      borderLeftColor: theme.grayBorder,
      borderRightColor: theme.grayBorder,
      borderTopColor: theme.grayBorder,
      backgroundColor: theme.background,
    };

    return (
      <TouchableHighlight
        underlayColor={theme.yellowUIFeedback}
        style={[styles.rowWrapper]}
        onPress={() => this.props.onDidPressSuggestedSite(site)}>
        <View
          accessibilityTraits="link"
          style={[styles.row, rowColors, lastRowStyle]}>
          <Image style={styles.icon} source={{uri: site.icon}} />
          <View style={styles.info}>
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              style={{...styles.url, color: theme.grayTitle}}>
              {site.url.replace(/^https?:\/\//, '')}
            </Text>
            <Text
              ellipsizeMode="tail"
              numberOfLines={2}
              style={{...styles.description, color: theme.graySubtitle}}>
              {site.description}
            </Text>
          </View>

          <Text
            style={{
              ...styles.connect,
              backgroundColor: theme.blueCallToAction,
              color: theme.buttonTextColor,
            }}>
            + Add
          </Text>
        </View>
      </TouchableHighlight>
    );
  }

  _renderSuggestedSitesIntro() {
    const theme = this.context;
    if (this.state.suggestedSitesLoaded) {
      return (
        <View style={styles.suggestedSitesContainer}>
          <Text style={styles.text}>
            <Text style={{...styles.title, color: theme.grayTitle}}>
              Don’t know where to start?
            </Text>
            {'\n'}
            <Text style={{color: theme.graySubtitle}}>
              Check out these popular communities.
            </Text>
          </Text>
        </View>
      );
    }
  }

  _renderOnBoardingHeader() {
    const theme = this.context;
    return (
      <View style={styles.addSiteContainer}>
        <Text style={styles.text}>
          <Text style={{...styles.title, color: theme.grayTitle}}>
            You don’t have any sites yet.
          </Text>
          {'\n'}
          <Text style={{color: theme.graySubtitle}}>
            Add Discourse sites to keep track of.
          </Text>
        </Text>

        <TouchableOpacity onPress={() => this.props.onDidPressAddSite()}>
          <Text
            style={{
              ...styles.addSiteButtonText,
              backgroundColor: theme.blueCallToAction,
              color: theme.buttonTextColor,
            }}>
            + Add your first site
          </Text>
        </TouchableOpacity>

        {this._renderSuggestedSitesIntro()}
      </View>
    );
  }

  render() {
    const theme = this.context;
    if (this.state.dataSource.size > 0) {
      return (
        <View style={{backgroundColor: theme.grayBackground, flex: 1}}>
          <ImmutableVirtualizedList
            style={styles.list}
            immutableData={this.state.dataSource}
            ListHeaderComponent={() => this._renderOnBoardingHeader()}
            renderItem={site => this._renderOnBoardingRow(site)}
            keyExtractor={site => site.url}
          />
        </View>
      );
    }
    return null;
  }
}
OnBoardingView.contextType = ThemeContext;

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    padding: 32,
    textAlign: 'center',
  },
  addSiteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    padding: 8,
    textAlign: 'center',
  },
  title: {
    fontWeight: '500',
  },
  rowWrapper: {
    marginRight: 16,
    marginLeft: 16,
  },
  row: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 12,
  },
  icon: {
    alignSelf: 'center',
    height: 40,
    width: 40,
  },
  info: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  url: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  description: {
    flex: 10,
    fontSize: 14,
  },
  connect: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    marginBottom: 6,
    overflow: 'hidden',
    padding: 6,
  },
  suggestedSitesContainer: {
    marginTop: 64,
  },
  addSiteContainer: {
    marginTop: 32,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
});

export default OnBoardingView;
