/* @flow */
"use strict";

import React from "react";
import Immutable from "immutable";

import { StyleSheet, View, Text, Linking } from "react-native";
import { SafeAreaView } from "react-navigation";
import { WebView } from "react-native-webview";

import Components from "./WebViewScreenComponents";
import colors from "../colors";

class WebViewScreen extends React.Component {
  constructor(props) {
    super(props);
    this.startUrl = this.props.navigation.getParam("url");
    this.siteManager = this.props.screenProps.siteManager;

    this.state = {
      progress: 0,
      scrollDirection: ""
    };
  }

  render() {
    let injectedJs = `
    var mobileLastScroll = 0;
    var mobileScrollDirection = '';

    function webviewScrollDirectionCheck() {
      let offset = document.body.scrollTop;
      const delta = Math.floor(offset - mobileLastScroll);

      if (delta <= 10 && delta >= -10)
        return true;

      if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 5) {
        return true;
      }

      const currDirection = delta > 0 ? 'down' : 'up';

      if (currDirection !== mobileScrollDirection) {
        mobileScrollDirection = currDirection;
        window.ReactNativeWebView.postMessage(JSON.stringify({'scrollDirection': currDirection, 'offset': offset}));
      }
      mobileLastScroll = Math.floor(offset);

    }

    document.addEventListener('scroll', function (event) {
      webviewScrollDirectionCheck();
    });

    true;`;

    return (
      <SafeAreaView
        style={styles.container}
        forceInset={{ top: "always", bottom: "never" }}
      >
        <Components.NavigationBar
          onDidPressRightButton={() => this._onDidPressRightButton()}
          onDidPressLeftButton={() => this._onDidPressLeftButton()}
          progress={this.state.progress}
          scrollDirection={this.state.scrollDirection}
        />
        <WebView
          ref={ref => (this.webview = ref)}
          source={{ uri: this.startUrl }}
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
          injectedJavaScript={injectedJs}
        />
      </SafeAreaView>
    );
  }

  componentWillUnmount() {
    clearTimeout(this.progressTimeout);
  }

  _onDidPressRightButton() {
    // react-navigation back action (exits webview)
    this.props.navigation.goBack();
  }

  _onDidPressLeftButton() {
    // back button navigation in webview
    this.webview.goBack();
  }

  _onMessage(event) {
    let data = JSON.parse(event.nativeEvent.data);
    if (data.scrollDirection) {
      let direction = data.scrollDirection;
      if (data.offset && data.offset < 50) {
        direction = "up";
      }
      this.setState({
        scrollDirection: direction
      });
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayBackground
  }
});

export default WebViewScreen;
