/* @flow */
"use strict";

import React from "react";
import Immutable from "immutable";

import {
  Animated,
  StyleSheet,
  View,
  Text,
  Linking,
  Platform,
  Dimensions,
  Share,
  StatusBar
} from "react-native";

import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-navigation";

import Components from "./WebViewScreenComponents";
import colors from "../colors";
import ProgressBar from "../ProgressBar";
import TinyColor from "../../lib/tinycolor";

class WebViewScreen extends React.Component {
  constructor(props) {
    super(props);
    this.startUrl = this.props.navigation.getParam("url");
    this.siteManager = this.props.screenProps.siteManager;

    this.routes = [];
    this.backForwardAction = null;
    this.currentIndex = 0;

    this.state = {
      progress: 0,
      scrollDirection: "",
      headerBg: colors.grayBackground,
      headerBgAnim: new Animated.Value(0),
      buttonColor: colors.grayUI,
      headerShadowColor: colors.grayUI,
      barStyle: "dark-content",
      currentUrl: "",
      canGoBack: false,
      canGoForward: false
    };
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.headerBg !== this.state.headerBg) {
      Animated.timing(this.state.headerBgAnim, {
        toValue: 1,
        duration: 250
      }).start();
    }
  }

  render() {
    let canGoBack = this.currentIndex > 1 ? true : false;
    let canGoForward = this.currentIndex < this.routes.length ? true : false;

    return (
      <Animated.View
        style={{
          ...styles.container,
          paddingTop: this._isIphoneX() ? 35 : 20,
          backgroundColor: this.state.headerBgAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.grayBackground, this.state.headerBg]
          })
        }}
      >
        <StatusBar barStyle={this.state.barStyle} />
        <View style={styles.progressHolder}>
          <ProgressBar progress={this.state.progress} />
        </View>
        <WebView
          ref={ref => (this.webview = ref)}
          source={{ uri: this.startUrl }}
          contentInset={{ top: 24 }}
          useWebkit={true}
          allowsBackForwardNavigationGestures={true}
          onShouldStartLoadWithRequest={request => {
            console.log("onShouldStartLoadWithRequest", request);
            if (request.url.startsWith("discourse://")) {
              this.props.navigation.goBack();
              return false;
            } else {
              // onShouldStartLoadWithRequest is sometimes triggered by ajax requests (ads, etc.)
              // this is a workaround to avoid launching Safari for these events
              if (request.url !== request.mainDocumentURL) {
                return true;
              }

              // launch Safari (and stop loading request) if external link
              if (!this.siteManager.urlInSites(request.url)) {
                Linking.openURL(request.url);
                return false;
              }
              return true;
            }
          }}
          decelerationRate={"normal"}
          onLoadProgress={({ nativeEvent }) => {
            const progress = nativeEvent.progress;
            this.setState({
              progress: progress
            });

            if (progress === 1) {
              this.progressTimeout = setTimeout(
                () => this.setState({ progress: 0 }),
                400
              );
            }
          }}
          onMessage={event => this._onMessage(event)}
        />
        <Components.NavigationBar
          onDidPressCloseButton={() => this._onDidPressCloseButton()}
          onDidPressBackButton={() => this._onDidPressBackButton()}
          onDidPressForwardButton={() => this._onDidPressForwardButton()}
          onDidPressShareButton={() => this._onDidPressShareButton()}
          isIphoneX={() => this._isIphoneX()}
          headerBg={this.state.headerBg}
          headerShadowColor={this.state.headerShadowColor}
          buttonColor={this.state.buttonColor}
          scrollDirection={this.state.scrollDirection}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        />
      </Animated.View>
    );
  }

  componentWillUnmount() {
    clearTimeout(this.progressTimeout);
  }

  _onDidPressCloseButton() {
    // react-navigation back action (exits webview)
    this.props.navigation.goBack();
  }

  _onDidPressBackButton() {
    // back button navigation in webview
    this.webview.goBack();
    this.backForwardAction = "back";
    this.currentIndex -= 1;
  }

  _onDidPressForwardButton() {
    // forward button navigation in webview
    this.webview.goForward();
    this.backForwardAction = "forward";
    this.currentIndex += 1;
  }

  _onDidPressShareButton() {
    Share.share({
      url: this.state.currentUrl
    });
  }

  _onMessage(event) {
    let data = JSON.parse(event.nativeEvent.data);
    console.log("_onMessage", data);

    let {
      scrollDirection,
      headerBg,
      buttonColor,
      currentUrl,
      headerShadowColor
    } = data;

    if (scrollDirection) this.setState({ scrollDirection: scrollDirection });
    if (buttonColor) this.setState({ buttonColor: data.buttonColor });
    if (currentUrl) this._updateRouteState(currentUrl);

    if (headerBg) {
      this.setState({ headerBg: headerBg });
      let color = TinyColor(data.headerBg);
      this.setState({
        barStyle: color.getBrightness() < 125 ? "light-content" : "dark-content"
      });
    }

    if (headerShadowColor)
      this.setState({ headerShadowColor: headerShadowColor });
  }

  _updateRouteState(url) {
    this.setState({
      currentUrl: url
    });

    if (this.backForwardAction) {
      this.backForwardAction = null;
      return;
    }

    this.routes.push(url);
    this.currentIndex = this.routes.length;
  }

  _isIphoneX() {
    const dimen = Dimensions.get("window");
    return (
      Platform.OS === "ios" &&
      !Platform.isPad &&
      !Platform.isTVOS &&
      (dimen.height === 812 ||
        dimen.width === 812 ||
        (dimen.height === 896 || dimen.width === 896))
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  progressHolder: {
    position: "relative"
  }
});

export default WebViewScreen;
