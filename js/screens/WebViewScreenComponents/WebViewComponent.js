/* @flow */
'use strict';

import React from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  Settings,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import ErrorScreen from '../WebViewScreenComponents/ErrorScreen';
import ProgressBar from '../../ProgressBar';
import chroma from 'chroma-js';
import SafariView from 'react-native-safari-view';
import i18n from 'i18n-js';
import Site from '../../site';
import { ThemeContext } from '../../ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';

export const withInsets = Component => {
  return props => {
    const insets = useSafeAreaInsets();

    return <Component insets={insets} {...props} />;
  };
};

const MAX_RELOAD_ATTEMPTS = 1;

class WebViewComponent extends React.Component {
  constructor(props) {
    super(props);

    this.siteManager = this.props.screenProps.siteManager;

    this.routes = [];
    this.backForwardAction = null;
    this.currentIndex = 0;
    this.safariViewVisible = false;

    // used in _overscrollVelocity
    this.lastScrollTime = Date.now();
    this.lastInPageScrollTime = Date.now();
    this.lastScrollY = 0;
    this.velocity = 0;

    SafariView.addEventListener('onShow', () => {
      this.safariViewVisible = true;
    });

    SafariView.addEventListener('onDismiss', () => {
      this.safariViewVisible = false;
    });

    this._handleAppStateChange = nextAppState => {
      this._sendAppStateChange(nextAppState);
      this._resetScrollOverflow();
    };

    this.state = {
      progress: 0,
      webviewReloadAttempts: 0,
      scrollDirection: '',
      headerBg: null,
      barStyle: 'dark-content', // default
      nudgeColor: 'black', // default
      errorData: null,
      userAgentSuffix: 'DiscourseHub',
      layoutCalculated: false,
      isLandscape: false,
      webviewUrl: this.props.url,
      authProcessActive: false,
      scrollOverflow: 0,
    };
  }

  componentDidMount() {
    const theme = this.context;

    this.setState({
      barStyle: theme.barStyle,
    });

    this.appStateSubscription = AppState.addEventListener(
      'change',
      this._handleAppStateChange,
    );
  }

  componentDidUpdate() {
    const url = this.props.url;

    if (url !== this.state.webviewUrl) {
      this.setState({
        webviewUrl: url,
      });
    }
  }

  _resetScrollOverflow() {
    if (this.state.scrollOverflow > 0) {
      this.setState({ scrollOverflow: 0 });
    }
  }

  _onLayout(event) {
    // The iPad user agent string no longer includes "iPad".
    // We want to serve desktop version on fullscreen iPad app
    // and mobile version on split view.
    // That's why we append the device ID (which includes "iPad" on large window sizes only)
    const { width, height } = event.nativeEvent.layout;

    this.setState({
      userAgentSuffix:
        width > 767
          ? `DiscourseHub ${this.props.screenProps.deviceId}`
          : 'DiscourseHub',
      layoutCalculated: true,
      isLandscape: width > height,
    });
  }

  get viewTopPadding() {
    if (this.props.insets.top) {
      return this.props.insets.top;
    } else if (this.state.isLandscape) {
      return 10;
    } else {
      return 20;
    }
  }

  _overscrollVelocity(currentScrollY) {
    const currentTimestamp = Date.now();

    // Avoid accidental overscroll if page had large enough scroll position in last 2 seconds
    if (currentTimestamp - this.lastInPageScrollTime < 2000) {
      return 0;
    }

    const timeDiff = (currentTimestamp - this.lastScrollTime) / 1000;
    const scrollDiff = currentScrollY - this.lastScrollY;

    if (timeDiff > 0) {
      this.velocity = scrollDiff / timeDiff;
    }

    this.lastScrollY = currentScrollY;
    this.lastScrollTime = currentTimestamp;

    return Math.round(this.velocity);
  }

  render() {
    const theme = this.context;

    return (
      <View
        onLayout={e => this._onLayout(e)}
        style={{
          flex: 1,
          paddingTop: this.viewTopPadding,
          backgroundColor: this.state.headerBg || theme.grayBackground,
        }}
      >
        <StatusBar barStyle={this.state.barStyle} />
        {this.state.layoutCalculated && this.state.authProcessActive && (
          <View
            style={{
              ...styles.authenticatingOverlay,
              backgroundColor: theme.background,
            }}
          >
            <ActivityIndicator size="large" color={theme.grayUI} />
          </View>
        )}
        {this.state.layoutCalculated && (
          <WebView
            originWhitelist={['http://*', 'https://*', 'about:srcdoc']}
            style={{
              marginTop: -1, // hacky fix to a 1px overflow just above header
              backgroundColor: this.state.headerBg,
            }}
            ref={ref => (this.webview = ref)}
            source={{ uri: this.state.webviewUrl }}
            applicationNameForUserAgent={this.state.userAgentSuffix}
            allowsBackForwardNavigationGestures={true}
            allowsInlineMediaPlayback={true}
            allowsFullscreenVideo={true}
            allowsLinkPreview={true}
            hideKeyboardAccessoryView={false}
            webviewDebuggingEnabled={true}
            onLoadEnd={() => {
              this.webview.requestFocus();
            }}
            onScroll={syntheticEvent => {
              const { contentOffset, layoutMeasurement } =
                syntheticEvent.nativeEvent;

              if (contentOffset.y < 5) {
                this.setState({ scrollOverflow: -contentOffset.y });
              } else {
                if (contentOffset.y > 500) {
                  this.lastInPageScrollTime = Date.now();
                }
                return;
              }

              const distanceThreshold = -Math.round(
                layoutMeasurement.height / 4,
              );
              const velocityThreshold = -Math.round(
                layoutMeasurement.height / 2,
              );

              const velocity = this._overscrollVelocity(contentOffset.y);

              if (
                contentOffset.y < distanceThreshold &&
                velocity < velocityThreshold
              ) {
                // Dismiss webview on quick swipe down
                this._onClose();
              }
            }}
            onError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              this.setState({ errorData: nativeEvent });
            }}
            renderError={errorName => (
              <ErrorScreen
                errorName={errorName}
                errorData={this.state.errorData}
                onRefresh={() => this._onRefresh()}
                onClose={() => this._onClose()}
              />
            )}
            startInLoadingState={true}
            renderLoading={() => (
              <ErrorScreen
                onRefresh={() => this._onRefresh()}
                onClose={() => this._onClose()}
              />
            )}
            onShouldStartLoadWithRequest={request => {
              // console.log('onShouldStartLoadWithRequest', request);

              // onShouldStartLoadWithRequest is sometimes triggered by ajax requests (ads, etc.)
              // this is a workaround to avoid launching Safari for these events
              if (request.url !== request.mainDocumentURL) {
                return true;
              }

              // on iOS, intercept 3rd party auth requests and handle them using ASWebAuthenticationSession
              const authRequest =
                request.url.startsWith(`${this.props.url}/session/sso`) ||
                request.url.startsWith(`${this.props.url}/auth/`);
              if (Platform.OS === 'ios' && authRequest) {
                if (!this.state.authProcessActive) {
                  this.requestAuth();
                }
                return false;
              }

              if (request.url.startsWith(this.props.url)) {
                return true;
              }

              if (
                request.url.startsWith('discourse://') ||
                request.url === 'about:blank'
              ) {
                return false;
              }
              if (!this.siteManager.urlInSites(request.url)) {
                // launch externally and stop loading request if external link
                // ensure URL can be opened, before opening an external URL
                Linking.canOpenURL(request.url)
                  .then(() => {
                    const useSVC = Settings.get('external_links_svc');
                    if (useSVC) {
                      if (!this.safariViewVisible) {
                        SafariView.show({ url: request.url });
                      }
                    } else {
                      Linking.openURL(request.url);
                    }
                  })
                  .catch(e => {
                    console.log('Linking.canOpenURL failed with ' + e);
                  });
                return false;
              }
              return true;
            }}
            onNavigationStateChange={navState => {
              this._storeLastPath(navState);
            }}
            decelerationRate={'normal'}
            onLoadProgress={({ nativeEvent }) => {
              const progress = nativeEvent.progress;
              this.setState({
                progress: progress === 1 ? 0 : progress,
              });
            }}
            onMessage={event => this._onMessage(event)}
            onContentProcessDidTerminate={event => {
              console.log('onContentProcessDidTerminate', event.nativeEvent);
              // reload the last URL when there is a crash
              // respect the MAX_RELOAD_ATTEMPTS limit
              // otherwise, we could end up in a blank screen
              this.setState({
                webviewReloadAttempts: this.state.webviewReloadAttempts + 1,
              });

              if (
                this.state.webviewReloadAttempts < MAX_RELOAD_ATTEMPTS &&
                event.nativeEvent.url
              ) {
                this._resetScrollOverflow();
                this.props.navigation.navigate('WebView', {
                  url: event.nativeEvent.url,
                });
              } else {
                this._onClose();
              }
            }}
          />
        )}
        <ProgressBar
          progress={this.state.progress}
          topInset={this.props.insets.top}
        />
        <View
          style={{
            ...styles.nudge,
            marginTop: Math.max(this.props.insets.top, this.props.insets.top),
            height: 30,
            zIndex: 2,
          }}
        >
          <View
            style={{
              ...styles.nudgeElement,
              backgroundColor: this.state.nudgeColor,
              opacity: 0.35,
            }}
          />
        </View>
        <BlurView
          blurAmount={this.state.scrollOverflow * 0.1}
          blurType={theme.name}
          pointerEvents={'none'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: this.state.scrollOverflow > 10 ? '120%' : 0,
            opacity: Math.max(30, this.state.scrollOverflow) / 100,
            width: '100%',
            zIndex: 1,
          }}
        />
      </View>
    );
  }

  componentWillUnmount() {
    clearTimeout(this.progressTimeout);
    this.keyboardWillShow?.remove();
    this.keyboardWillHide?.remove();

    this.siteManager.refreshSites();
    this.siteManager.clearActiveSite();
    this.appStateSubscription?.remove();
  }

  _sendAppStateChange(appState) {
    const appStateChange = `
      window.dispatchEvent(new CustomEvent("AppStateChange", { detail: { newAppState: "${appState}" } }));
      true;
    `;

    this.webview.injectJavaScript(appStateChange);
  }

  _storeLastPath(navState) {
    if (!navState.loading) {
      this.siteManager.storeLastPath(navState);
    }
  }

  _onRefresh() {
    this.webview.reload();
  }

  _onClose() {
    if (this.props.navigation.canGoBack()) {
      this.props.navigation.goBack();
    }
  }

  async addSite() {
    try {
      const newSite = await Site.fromTerm(this.state.webviewUrl);
      if (newSite) {
        this.siteManager.add(newSite);
        await this.siteManager.setActiveSite(newSite);
        this.requestAuth();
      }
    } catch (error) {
      // Not sure we need to surface anything to the user here
      console.error(error);
    }
  }

  async requestAuth() {
    const site = this.siteManager.activeSite;
    if (!site) {
      Alert.alert(
        i18n.t('add_site_home_screen'),
        i18n.t('add_site_home_screen_description'),
        [
          { text: i18n.t('cancel') },
          { text: i18n.t('ok'), onPress: () => this.addSite() },
        ],
      );
      return;
    }

    this.setState({ authProcessActive: true });

    const url = await this.siteManager.generateAuthURL(site);
    const authURL = await this.siteManager.requestAuth(url);

    this.setState({ authProcessActive: false });

    if (authURL) {
      // this may seem odd to navigate to the same screen
      // but we want to use the same path as notifications and reset the local state
      // via componentDidUpdate
      this.props.navigation.navigate('WebView', { url: authURL });
    }
  }

  _onMessage(event) {
    let data = JSON.parse(event.nativeEvent.data);

    let { headerBg, shareUrl, dismiss, markRead, showLogin } = data;

    if (headerBg && chroma.valid(headerBg)) {
      const headerBgChroma = chroma(headerBg);
      const headerBgString = headerBgChroma.hex('rgb');

      this.setState({
        headerBg: headerBgString,
        barStyle:
          headerBgChroma.luminance() < 0.5 ? 'light-content' : 'dark-content',
        nudgeColor: headerBgChroma.luminance() < 0.5 ? 'white' : 'black',
      });
    }

    if (shareUrl) {
      Share.share({
        url: shareUrl,
      });
    }

    if (dismiss) {
      // react-navigation back action (exits webview)
      this.props.navigation.goBack();
    }

    if (markRead) {
      // refresh app icon badge count when one site's notifications are dismissed
      this.siteManager.refreshSites();
    }

    if (showLogin && Platform.OS === 'ios') {
      // show login screen inside ASWebAuthenticationSession
      this.requestAuth();
    }
  }
}

WebViewComponent.contextType = ThemeContext;

const styles = StyleSheet.create({
  nudge: {
    width: '20%',
    left: '40%',
    position: 'absolute',
    backgroundColor: 'transparent',
    top: -10,
  },
  nudgeElement: {
    borderRadius: 5,
    width: '50%',
    marginLeft: '25%',
    height: 4,
    marginTop: 10,
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
});

export default withInsets(WebViewComponent);
