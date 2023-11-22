/* @flow */
'use strict';

import React from 'react';
import {
  Alert,
  Animated,
  Easing,
  Linking,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import DraggableFlatList from 'react-native-draggable-flatlist';
import SafariWebAuth from 'react-native-safari-web-auth';
import Site from '../site';
import Components from './HomeScreenComponents';
import {HEIGHT as TERM_BAR_HEIGHT} from './HomeScreenComponents/TermBar';
import {ThemeContext} from '../ThemeContext';
import i18n from 'i18n-js';
import {donateShortcut} from 'react-native-siri-shortcut';
import Toast, {BaseToast} from 'react-native-toast-message';

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

const toastConfig = {
  success: props => (
    <BaseToast
      {...props}
      style={{borderLeftColor: 'transparent'}}
      onPress={() => {
        if (Platform.OS === 'android') {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        }
        if (Platform.OS === 'ios') {
          // We can't call PushNotificationIOS.requestPermissions again
          // per https://developer.apple.com/documentation/usernotifications/asking_permission_to_use_notifications?language=objc
          // only the first authorization request is honored
          Linking.openURL('App-Prefs:NOTIFICATIONS_ID');
        }
      }}
      contentContainerStyle={{paddingHorizontal: 10}}
      text1Style={{
        fontSize: 17,
        fontWeight: '400',
      }}
      text2Style={{
        fontSize: 17,
      }}
    />
  ),
};

class HomeScreen extends React.Component {
  constructor(props) {
    super(props);

    this._siteManager = this.props.screenProps.siteManager;

    this.state = {
      addSiteProgress: 0,
      displayTermBar: false,
      anim: new Animated.Value(0),
      data: [],
      isRefreshing: false,
      lastRefreshTime: null,
      scrollEnabled: true,
      refreshingEnabled: true,
      loadingSites: this._siteManager.isLoading(),
    };

    this._onChangeSites = e => this.onChangeSites(e);
    this._dragItem = this._dragItem.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  visitSite(site, connect = false, endpoint = '') {
    this._siteManager.setActiveSite(site);

    if (site.authToken) {
      if (site.oneTimePassword) {
        this.props.screenProps.openUrl(
          `${site.url}/session/otp/${site.oneTimePassword}`,
        );
      } else {
        if (this._siteManager.supportsDelegatedAuth(site)) {
          this._siteManager.generateURLParams(site).then(params => {
            this.props.screenProps.openUrl(`${site.url}${endpoint}?${params}`);
          });
        } else {
          this.donateShortcut(site);
          this.props.screenProps.openUrl(
            `${site.url}${endpoint}?discourse_app=1`,
            false,
          );
        }
      }
      return;
    }

    if (connect || site.loginRequired) {
      this._siteManager.generateAuthURL(site).then(url => {
        if (this._siteManager.supportsDelegatedAuth(site)) {
          SafariWebAuth.requestAuth(url);
        } else {
          this.props.screenProps.openUrl(url, false);
        }
      });
    } else {
      this.donateShortcut(site);
      this.props.screenProps.openUrl(`${site.url}`);
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

  async promptForNotifications() {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.checkPermissions(permissions => {
        console.log(permissions);
        if (permissions.alert === false) {
          this.showPNToast();
        }
      });
    }

    // Android 33+ has a permission request prompt
    // versions before that permissions is always granted
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      let granted = true;

      granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (!granted) {
        this.showPNToast();
      }
    }
  }

  showPNToast() {
    Toast.show({
      type: 'success',
      text1: i18n.t('site_added'),
      text2: i18n.t('enable_notifications'),
      position: 'bottom',
      visibilityTime: 6000,
    });
  }

  doSearch(term) {
    if (term.length === 0) {
      return new Promise((resolve, reject) => reject());
    }

    this.setState({addSiteProgress: Math.random() * 0.4});

    return new Promise((resolve, reject) => {
      Site.fromTerm(term)
        .then(site => {
          this.setState(
            {
              displayTermBar: false,
              addSiteProgress: 1,
            },
            () => {
              this.onToggleTermBar(this.state.displayTermBar);
            },
          );

          if (site) {
            if (this._siteManager.exists(site)) {
              throw 'dupe site';
            }
            this._siteManager.add(site);
          }

          this.promptForNotifications();

          resolve(site);
        })
        .catch(e => {
          console.log(e);

          if (e === 'dupe site') {
            Alert.alert(i18n.t('term_exists', {term}));
          } else if (e === 'bad api') {
            Alert.alert(i18n.t('incorrect_url', {term}));
          } else {
            Alert.alert(i18n.t('not_found', {term}));
          }

          this.setState({displayTermBar: true, addSiteProgress: 1});
          this.onToggleTermBar(this.state.displayTermBar);

          reject('failure');
        })
        .finally(() => {
          setTimeout(() => {
            this.setState({addSiteProgress: 0});
          }, 1000);
        });
    });
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
      !this.state.isRefreshing &&
      this.state.addSiteProgress === 0
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

  _renderItem({item, index, drag, isActive}) {
    return (
      <Components.SiteRow
        site={item}
        onSwipe={scrollEnabled => this.setState({scrollEnabled: scrollEnabled})}
        onClick={(endpoint = '') => this.visitSite(item, false, endpoint)}
        onClickConnect={() => this.visitSite(item, true)}
        onDelete={() => this._siteManager.remove(item)}
        onLongPress={drag}
      />
    );
  }

  _dragItem({data, from, to}) {
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
          onDidPressAddSite={() =>
            this.setState({displayTermBar: true}, () => {
              this.onToggleTermBar(this.state.displayTermBar);
            })
          }
        />
      );
    } else {
      return (
        <DraggableFlatList
          style={styles.sitesList}
          activationDistance={20}
          data={this.state.data}
          renderItem={item => this._renderItem(item)}
          keyExtractor={(item, index) => `draggable-item-${item.url}`}
          onDragEnd={this._dragItem}
          scaleSelectionFactor={1.05}
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
      );
    }
  }

  onToggleTermBar(show) {
    Animated.timing(this.state.anim, {
      easing: Easing.inOut(Easing.ease),
      duration: 200,
      toValue: show ? 1 : 0,
      useNativeDriver: true,
    }).start(() => {
      if (this._input) {
        show ? this._input.focus() : this._input.blur();
      }
    });
  }

  onDidPressLeftButton() {
    this.setState({displayTermBar: !this.state.displayTermBar}, () => {
      this.onToggleTermBar(this.state.displayTermBar);
    });
  }

  onDidPressRightButton() {
    this.props.navigation.navigate('Notifications');
  }

  onDidPressAndroidSettingsIcon() {
    this.props.navigation.navigate('Settings');
  }

  render() {
    const theme = this.context;
    const translateY = this.state.anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, TERM_BAR_HEIGHT],
    });
    return (
      <>
        <SafeAreaView
          style={[styles.container, {backgroundColor: theme.background}]}>
          <Components.NavigationBar
            leftButtonIconRotated={this.state.displayTermBar}
            anim={this.state.anim}
            rightButtonIconColor={theme.grayUI}
            onDidPressLeftButton={() => this.onDidPressLeftButton()}
            onDidPressRightButton={() => this.onDidPressRightButton()}
            progress={this.state.addSiteProgress}
          />
          <Components.TermBar
            anim={this.state.anim}
            getInputRef={ref => (this._input = ref)}
            onDidSubmitTerm={term => this.doSearch(term)}
          />
          <Animated.View
            style={[styles.sitesContainer, {transform: [{translateY}]}]}>
            {this._renderSites()}
            {this._renderDebugRow()}
          </Animated.View>
        </SafeAreaView>
        <Toast config={toastConfig} />
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
    marginTop: -TERM_BAR_HEIGHT,
    paddingBottom: 40,
  },
  sitesList: {
    height: '100%',
  },
});

export default HomeScreen;
