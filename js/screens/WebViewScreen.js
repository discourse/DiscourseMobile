/* @flow */
'use strict';

import React from 'react';

import {
  Animated,
  View,
  Linking,
  Keyboard,
  Settings,
  Share,
  StatusBar,
} from 'react-native';

import {WebView} from 'react-native-webview';

import Components from './WebViewScreenComponents';
import ProgressBar from '../ProgressBar';
import TinyColor from '../../lib/tinycolor';
import SafariView from 'react-native-safari-view';

import {ThemeContext} from '../ThemeContext';

class WebViewScreen extends React.Component {
  static navigationOptions = ({screenProps}) => {
    // avoid accidental scroll down to dismiss action on devices without a notch
    return {
      gestureResponseDistance: {
        vertical: screenProps.hasNotch ? 135 : 75,
      },
    };
  };

  constructor(props) {
    super(props);
    this.siteManager = this.props.screenProps.siteManager;

    this.routes = [];
    this.backForwardAction = null;
    this.currentIndex = 0;
    this.safariViewVisible = false;

    SafariView.addEventListener('onShow', () => {
      this.safariViewVisible = true;
    });

    SafariView.addEventListener('onDismiss', () => {
      this.safariViewVisible = false;
    });

    this.state = {
      progress: 0,
      scrollDirection: '',
      headerBg: 'transparent',
      headerBgAnim: new Animated.Value(0),
      barStyle: 'dark-content', // default
      errorData: null,
      userAgentSuffix: 'DiscourseHub',
      layoutCalculated: false,
      hasNotch: this.props.screenProps.hasNotch,
      isLandscape: false,
      webviewUrl: this.props.navigation.getParam('url'),
    };
  }

  componentDidMount() {
    const theme = this.context;
    this.setState({
      headerBg: theme.grayBackground,
      barStyle: theme.barStyle,
    });

    // Workaround for StatusBar bug in RN Webview
    // https://github.com/react-native-community/react-native-webview/issues/735
    this.keyboardWillShow = Keyboard.addListener(
      'keyboardWillShow',
      this._onKeyboardShow.bind(this),
    );
    this.keyboardWillHide = Keyboard.addListener(
      'keyboardDidHide',
      this._onKeyboardShow.bind(this),
    );
  }

  componentDidUpdate() {
    const url = this.props.navigation.getParam('url');

    if (url !== this.state.webviewUrl) {
      this.setState({
        webviewUrl: url,
      });
    }
  }

  UNSAFE_componentWillUpdate(nextProps, nextState) {
    if (nextState.headerBg !== this.state.headerBg) {
      Animated.timing(this.state.headerBgAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }

  _onLayout(event) {
    // The iPad user agent string no longer includes "iPad".
    // We want to serve desktop version on fullscreen iPad app
    // and mobile version on split view.
    // That's why we append the device ID (which includes "iPad" on large window sizes only)
    var {width, height} = event.nativeEvent.layout;

    this.setState({
      userAgentSuffix:
        width > 767
          ? `DiscourseHub ${this.props.screenProps.deviceId}`
          : 'DiscourseHub',
      layoutCalculated: true,
      isLandscape: width > height,
    });
  }

  render() {
    const theme = this.context;

    let viewTopPadding = 0;

    if (this.props.screenProps.deviceId.startsWith('iPad')) {
      viewTopPadding = 15;
    } else {
      viewTopPadding = this.state.isLandscape
        ? 10
        : this.state.hasNotch
        ? 35
        : 20;
    }

    return (
      <Animated.View
        onLayout={e => this._onLayout(e)}
        style={{
          flex: 1,
          paddingTop: viewTopPadding,
          backgroundColor: this.state.headerBgAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [theme.grayBackground, this.state.headerBg],
          }),
        }}>
        <StatusBar barStyle={this.state.barStyle} />
        <View
          style={{
            marginTop: this.state.isLandscape ? 0 : this.state.hasNotch ? 8 : 0,
          }}>
          <ProgressBar progress={this.state.progress} />
        </View>
        {this.state.layoutCalculated && (
          <WebView
            style={{
              marginTop: -1, // hacky fix to a 1px overflow just above header
            }}
            ref={ref => (this.webview = ref)}
            source={{uri: this.state.webviewUrl}}
            applicationNameForUserAgent={this.state.userAgentSuffix}
            allowsBackForwardNavigationGestures={true}
            allowsInlineMediaPlayback={true}
            allowsFullscreenVideo={true}
            allowsLinkPreview={true}
            onError={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              this.setState({errorData: nativeEvent});
            }}
            renderError={errorName => (
              <Components.ErrorScreen
                errorName={errorName}
                errorData={this.state.errorData}
                onRefresh={() => this._onRefresh()}
                onClose={() => this._onClose()}
              />
            )}
            startInLoadingState={true}
            renderLoading={() => (
              <Components.ErrorScreen
                onRefresh={() => this._onRefresh()}
                onClose={() => this._onClose()}
              />
            )}
            onShouldStartLoadWithRequest={request => {
              console.log('onShouldStartLoadWithRequest', request);
              if (request.url.startsWith('discourse://')) {
                this.props.navigation.goBack();
                return false;
              } else {
                // onShouldStartLoadWithRequest is sometimes triggered by ajax requests (ads, etc.)
                // this is a workaround to avoid launching Safari for these events
                if (request.url !== request.mainDocumentURL) {
                  return true;
                }

                // launch externally and stop loading request if external link
                if (!this.siteManager.urlInSites(request.url)) {
                  // ensure URL can be opened, before opening an external URL
                  Linking.canOpenURL(request.url)
                    .then(() => {
                      const useSVC = Settings.get('external_links_svc');
                      if (useSVC) {
                        if (!this.safariViewVisible) {
                          SafariView.show({url: request.url});
                        }
                      } else {
                        Linking.openURL(request.url);
                      }
                    })
                    .catch(e => {
                      console.log('failed to fetch notifications ' + e);
                    });
                  return false;
                }
                return true;
              }
            }}
            onNavigationStateChange={() => {
              StatusBar.setBarStyle(this.state.barStyle, true);
            }}
            decelerationRate={'normal'}
            onLoadProgress={({nativeEvent}) => {
              const progress = nativeEvent.progress;
              this.setState({
                progress: progress,
              });

              if (progress === 1) {
                this.progressTimeout = setTimeout(
                  () => this.setState({progress: 0}),
                  400,
                );
              }
            }}
            onMessage={event => this._onMessage(event)}
            onContentProcessDidTerminate={event => {
              console.log('onContentProcessDidTerminate', event);
              this._onClose();
            }}
          />
        )}
      </Animated.View>
    );
  }

  componentWillUnmount() {
    clearTimeout(this.progressTimeout);
    this.keyboardWillShow?.remove();
    this.keyboardWillHide?.remove();
    this.siteManager.refreshSites();
  }

  _onKeyboardShow() {
    StatusBar.setBarStyle(this.state.barStyle);
  }

  _onRefresh() {
    this.webview.reload();
  }

  _onClose() {
    this.props.navigation.goBack();
  }

  _onMessage(event) {
    let data = JSON.parse(event.nativeEvent.data);
    let {headerBg, shareUrl, dismiss, markRead} = data;

    if (headerBg) {
      // when fully transparent, use black status bar
      if (TinyColor(headerBg).getAlpha() === 0) {
        headerBg = 'rgb(0,0,0)';
      }

      this.setState({
        headerBg: headerBg,
        barStyle:
          TinyColor(headerBg).getBrightness() < 125
            ? 'light-content'
            : 'dark-content',
      });
      // ugly hack for an outstanding react-native-webview issue with the statusbar
      // https://github.com/react-native-community/react-native-webview/issues/735
      setTimeout(() => {
        StatusBar.setBarStyle(this.state.barStyle);
      }, 400);
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
  }
}
WebViewScreen.contextType = ThemeContext;

export default WebViewScreen;
