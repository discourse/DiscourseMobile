/* @flow */
'use strict';

import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import Components from './HomeScreenComponents';
import {ThemeContext} from '../ThemeContext';
import i18n from 'i18n-js';
import {donateShortcut} from 'react-native-siri-shortcut';
import {BottomTabBarHeightContext} from '@react-navigation/bottom-tabs';
import {SafeAreaView} from 'react-native-safe-area-context';
import DragList from 'react-native-draglist';
import DeviceInfo from 'react-native-device-info';

class HomeScreen extends React.Component {
  constructor(props) {
    super(props);

    this._siteManager = this.props.screenProps.siteManager;

    this.largeLayout = Dimensions.get('window').width > 600;
    console.log(Dimensions.get('window').width);
    this.state = {
      data: [],
      isRefreshing: false,
      lastRefreshTime: null,
      scrollEnabled: true,
      refreshingEnabled: true,
      loadingSites: this._siteManager.isLoading(),
      authProcessActive: false,
      showTopicList: false,
      fadeIn: new Animated.Value(0),
    };

    this._animateFadeIn();
    this._onChangeSites = e => this.onChangeSites(e);
    this.onReordered = this.onReordered.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  async visitSite(site, connect = false, endpoint = '') {
    this._siteManager.setActiveSite(site);
    this.donateShortcut(site);

    if (site.authToken) {
      if (site.oneTimePassword) {
        this.props.screenProps.openUrl(
          `${site.url}/session/otp/${site.oneTimePassword}`,
        );
      } else {
        if (Platform.OS === 'ios') {
          const params = await this._siteManager.generateURLParams(site);
          this.props.screenProps.openUrl(`${site.url}${endpoint}?${params}`);
        } else {
          this.props.screenProps.openUrl(
            `${site.url}${endpoint}?discourse_app=1`,
          );
        }
      }
      return;
    }

    if (connect || site.loginRequired) {
      const authUrl = await this._siteManager.generateAuthURL(site);
      if (Platform.OS === 'ios') {
        this.setState({authProcessActive: true});
        const requestAuthURL = await this._siteManager.requestAuth(authUrl);

        if (requestAuthURL) {
          this.props.screenProps.openUrl(requestAuthURL);
        } else {
          // TODO: auth got cancelled or error, show a message?
        }
        this.setState({authProcessActive: false});
      } else {
        this.props.screenProps.openUrl(authUrl);
      }
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
      keywords: ['discourse', 'forums', 'hub', 'discoursehub', site.title],
      persistentIdentifier: 'DiscourseHubShortcut',
      isEligibleForSearch: true,
      isEligibleForPrediction: true,
      suggestedInvocationPhrase: site.title,
      needsSave: true,
      title: `Open ${site.title}`,
      userInfo: {
        siteUrl: site.url,
      },
      requiredUserInfoKeys: ['siteUrl'],
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

  _animateFadeIn() {
    Animated.timing(this.state.fadeIn, {
      toValue: 0.9,
      duration: 250,
      delay: 2000,
      useNativeDriver: true,
    }).start();
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

  _renderTopicListToggle() {
    const theme = this.context;

    if (this.largeLayout && this._siteManager.sites.length > 1) {
      return (
        <Animated.View
          style={{
            ...styles.topicListToggleWrapper,
            opacity: this.state.fadeIn,
          }}>
          <TouchableHighlight
            testID="topic-list-toggle"
            style={{
              ...styles.topicListToggle,
              backgroundColor: theme.background,
              borderColor: theme.grayBorder,
            }}
            underlayColor={theme.yellowUIFeedback}
            onPress={() => {
              this.setState({
                showTopicList: !this.state.showTopicList,
              });
              this.dragListRef.scrollToOffset({animated: true, offset: 0});
            }}>
            <Text style={{color: theme.grayTitle}}>
              {this.state.showTopicList
                ? i18n.t('hide_hot_topics')
                : i18n.t('show_hot_topics')}
            </Text>
          </TouchableHighlight>
        </Animated.View>
      );
    }
  }
  _renderItem(info) {
    const {item, onDragStart, onDragEnd} = info;

    return (
      <Components.SiteRow
        site={item}
        siteManager={this._siteManager}
        onSwipe={scrollEnabled => this.setState({scrollEnabled: scrollEnabled})}
        onClick={(endpoint = '') => this.visitSite(item, false, endpoint)}
        onClickConnect={() => this.visitSite(item, true)}
        onDelete={() => this._siteManager.remove(item)}
        onLongPress={onDragStart}
        onPressOut={onDragEnd}
        keyExtractor={() => `site-row-${item.url}`}
        showTopicList={this.state.showTopicList}
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
        />
      );
    } else {
      return (
        <BottomTabBarHeightContext.Consumer>
          {tabBarHeight => (
            <View style={{flex: 1}}>
              <DragList
                ref={ref => {
                  this.dragListRef = ref;
                }}
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
                ListFooterComponent={this._renderTopicListToggle()}
              />
            </View>
          )}
        </BottomTabBarHeightContext.Consumer>
      );
    }
  }

  onDidPressAndroidSettingsIcon() {
    this.props.navigation.navigate('Settings');
  }

  onDidPressPlusIcon() {
    this.props.navigation.navigate('AddSite');
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
            onDidPressPlusIcon={() => this.onDidPressPlusIcon()}
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
          {this.state.authProcessActive && (
            <View
              style={{
                ...styles.authenticatingOverlay,
                backgroundColor: theme.background,
              }}>
              <ActivityIndicator size="large" color={theme.grayUI} />
            </View>
          )}
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
  authenticatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    opacity: 0.75,
  },
  topicListToggleWrapper: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicListToggle: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
});

export default HomeScreen;
