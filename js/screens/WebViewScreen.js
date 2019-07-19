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
  Settings,
  Share,
  StatusBar
} from "react-native";

import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-navigation";

import Components from "./WebViewScreenComponents";
import colors from "../colors";
import ProgressBar from "../ProgressBar";
import TinyColor from "../../lib/tinycolor";
import SafariView from "react-native-safari-view";
class WebViewScreen extends React.Component {
  constructor(props) {
    super(props);
    this.startUrl = this.props.navigation.getParam("url");
    this.siteManager = this.props.screenProps.siteManager;

    this.routes = [];
    this.backForwardAction = null;
    this.currentIndex = 0;
    this.safariViewVisible = false;

    SafariView.addEventListener("onShow", () => {
      this.safariViewVisible = true;
    });

    SafariView.addEventListener("onDismiss", () => {
      this.safariViewVisible = false;
    });

    this.state = {
      progress: 0,
      scrollDirection: "",
      headerBg: colors.grayBackground,
      headerBgAnim: new Animated.Value(0),
      barStyle: "dark-content",
      errorData: null
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
        <View style={{ marginTop: this._isIphoneX() ? 8 : 0 }}>
          <ProgressBar progress={this.state.progress} />
        </View>
        <WebView
          ref={ref => (this.webview = ref)}
          source={{ uri: this.startUrl }}
          useWebkit={true}
          applicationNameForUserAgent={"DiscourseHub"}
          allowsBackForwardNavigationGestures={true}
          allowsInlineMediaPlayback={true}
          onError={syntheticEvent => {
            const { nativeEvent } = syntheticEvent;
            this.setState({ errorData: nativeEvent });
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

              // launch externally and stop loading request if external link
              if (!this.siteManager.urlInSites(request.url)) {
                const useSVC = Settings.get("external_links_svc");
                if (useSVC) {
                  if (!this.safariViewVisible) {
                    SafariView.show({ url: request.url });
                  }
                } else {
                  Linking.openURL(request.url);
                }
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
      </Animated.View>
    );
  }

  componentWillUnmount() {
    clearTimeout(this.progressTimeout);
  }

  _onRefresh() {
    this.webview.reload();
  }

  _onClose() {
    this.props.navigation.goBack();
  }

  _onMessage(event) {
    let data = JSON.parse(event.nativeEvent.data);
    console.log("_onMessage", data);

    let { headerBg, shareUrl, dismiss } = data;

    if (headerBg) {
      this.setState({
        headerBg: headerBg,
        barStyle:
          TinyColor(headerBg).getBrightness() < 125
            ? "light-content"
            : "dark-content"
      });
    }

    if (shareUrl) {
      Share.share({
        url: shareUrl
      });
    }

    if (dismiss) {
      // react-navigation back action (exits webview)
      this.props.navigation.goBack();
    }
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
  }
});

export default WebViewScreen;
