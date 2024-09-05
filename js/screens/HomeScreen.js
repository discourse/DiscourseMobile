/* @flow */
'use strict';

import React from 'react';
import {Platform, RefreshControl, StyleSheet, View} from 'react-native';

import SafariWebAuth from 'react-native-safari-web-auth';
import Components from './HomeScreenComponents';
import {ThemeContext} from '../ThemeContext';
import i18n from 'i18n-js';
import {donateShortcut} from 'react-native-siri-shortcut';
import {BottomTabBarHeightContext} from '@react-navigation/bottom-tabs';
import {SafeAreaView} from 'react-native-safe-area-context';
import DragList from 'react-native-draglist';

class HomeScreen extends React.Component {
  constructor(props) {
    super(props);

    this._siteManager = this.props.screenProps.siteManager;

    this.state = {
      data: [],
      isRefreshing: false,
      lastRefreshTime: null,
      scrollEnabled: true,
      refreshingEnabled: true,
      loadingSites: this._siteManager.isLoading(),
    };

    this._onChangeSites = e => this.onChangeSites(e);
    this.onReordered = this.onReordered.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  visitSite(site, connect = false, endpoint = '') {
    this._siteManager.setActiveSite(site);
    this.donateShortcut(site);

    if (site.authToken) {
      if (site.oneTimePassword) {
        this.props.screenProps.openUrl(
          `${site.url}/session/otp/${site.oneTimePassword}`,
        );
      } else {
        if (Platform.OS === 'ios') {
          this._siteManager.generateURLParams(site).then(params => {
            this.props.screenProps.openUrl(`${site.url}${endpoint}?${params}`);
          });
        } else {
          this.props.screenProps.openUrl(
            `${site.url}${endpoint}?discourse_app=1`,
          );
        }
      }
      return;
    }

    if (connect || site.loginRequired) {
      this._siteManager.generateAuthURL(site).then(url => {
        SafariWebAuth.requestAuth(url);
      });
    } else {
      this.props.screenProps.openUrl(`${site.url}${endpoint}`);
    }
  }

  donateShortcut(site) {
    if (Platform.OS !== 'ios') {
      return;
    }

    const shortcutOptions = {
      // This activity type needs to be set in `NSUserActivityTypes` on the Info.plist
      activityType: 'org.discourse.DiscourseApp.SiriShortcut',
      keywords: ['discourse', 'forums', 'hub', site.title],
      persistentIdentifier: 'DiscourseHubShortcut',
      isEligibleForSearch: true,
      isEligibleForPrediction: true,
      suggestedInvocationPhrase: site.title,
      needsSave: true,
      title: `Open ${site.title}`,
      userInfo: {
        siteUrl: site.url,
      },
    };

    donateShortcut(shortcutOptions);
  }

  componentDidMount() {
    this._siteManager.subscribe(this._onChangeSites);
    this._onChangeSites();
  }

  componentWillUnmount() {
    this._siteManager.unsubscribe(this._onChangeSites);
  }

  onChangeSites(e) {
    if (this._siteManager.isLoading() !== this.state.loadingSites) {
      this.setState({loadingSites: this._siteManager.isLoading()});
    }
    if (e && e.event) {
      this.setState({data: this._siteManager.listSites()});
    }
  }

  pullDownToRefresh() {
    this._siteManager
      .refreshSites()
      .catch(e => {
        console.log(e);
      })
      .then(() => {
        this.setState({isRefreshing: false});
      });
  }

  shouldDisplayOnBoarding() {
    return (
      this._siteManager.sites.length === 0 &&
      !this.refreshing &&
      !this.state.isRefreshing
    );
  }

  _renderDebugRow() {
    if (this._siteManager.sites.length !== 0) {
      return (
        <Components.DebugRow
          siteManager={this._siteManager}
          onDidPressAndroidSettingsIcon={() =>
            this.onDidPressAndroidSettingsIcon()
          }
        />
      );
    }
  }

  _renderItem(info) {
    const {item, onDragStart, onDragEnd} = info;

    return (
      <Components.SiteRow
        site={item}
        onSwipe={scrollEnabled => this.setState({scrollEnabled: scrollEnabled})}
        onClick={(endpoint = '') => this.visitSite(item, false, endpoint)}
        onClickConnect={() => this.visitSite(item, true)}
        onDelete={() => this._siteManager.remove(item)}
        onLongPress={onDragStart}
        onPressOut={onDragEnd}
        keyExtractor={() => `site-row-${item.url}`}
      />
    );
  }

  onReordered(from, to) {
    this._siteManager.updateOrder(from, to);
  }

  _renderSites() {
    const theme = this.context;
    if (this.state.loadingSites) {
      return <View style={{flex: 1}} />;
    }

    if (this.shouldDisplayOnBoarding()) {
      return (
        <Components.OnBoardingView
          style={{backgroundColor: theme.grayBackground}}
          onDidPressAddSite={() => this.props.navigation.navigate('Discover')}
        />
      );
    } else {
      return (
        <BottomTabBarHeightContext.Consumer>
          {tabBarHeight => (
            <DragList
              style={styles.sitesList}
              contentContainerStyle={{paddingBottom: tabBarHeight}}
              activationDistance={20}
              data={this.state.data}
              renderItem={item => this._renderItem(item)}
              keyExtractor={(item, index) => `draggable-item-${item.url}`}
              onReordered={this.onReordered}
              scaleSelectionFactor={1.05}
              estimatedItemSize={130}
              refreshControl={
                <RefreshControl
                  style={{left: 500}}
                  enabled={this.state.refreshingEnabled}
                  refreshing={this.state.isRefreshing}
                  onRefresh={() => this.pullDownToRefresh()}
                  title={i18n.t('loading')}
                  titleColor={theme.graySubtitle}
                />
              }
            />
          )}
        </BottomTabBarHeightContext.Consumer>
      );
    }
  }

  onDidPressAndroidSettingsIcon() {
    this.props.navigation.navigate(i18n.t('settings'));
  }

  render() {
    const theme = this.context;

    return (
      <>
        <SafeAreaView
          style={[styles.container, {backgroundColor: theme.background}]}>
          <Components.NavigationBar
            onDidPressAndroidSettingsIcon={() =>
              this.onDidPressAndroidSettingsIcon()
            }
          />
          <View
            style={[
              styles.sitesContainer,
              {
                backgroundColor: theme.grayBackground,
              },
            ]}>
            {this._renderSites()}
            {/* {this._renderDebugRow()} */}
          </View>
        </SafeAreaView>
      </>
    );
  }
}

HomeScreen.contextType = ThemeContext;

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  sitesContainer: {
    flex: 1,
  },
  sitesList: {},
});

export default HomeScreen;
