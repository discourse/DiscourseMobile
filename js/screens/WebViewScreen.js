/* @flow */
"use strict";

import React from "react";
import Immutable from "immutable";

import { StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-navigation";
import { WebView } from "react-native-webview";

import Components from "./WebViewScreenComponents";
import colors from "../colors";

class WebViewScreen extends React.Component {
  constructor(props) {
    super(props);
    this.startUrl = this.props.navigation.getParam("url");

    this.state = {
      progress: 0
    };
  }

  render() {
    return (
      <SafeAreaView
        style={styles.container}
        forceInset={{ top: "never", bottom: "never" }}
      >
        <Components.NavigationBar
          onDidPressRightButton={() => this._onDidPressRightButton()}
          onDidPressLeftButton={() => this._onDidPressLeftButton()}
          progress={this.state.progress}
        />
        <WebView
          ref={ref => (this.webview = ref)}
          source={{ uri: this.startUrl }}
          useWebkit={true}
          allowsBackForwardNavigationGestures={true}
          onLoadProgress={({ nativeEvent }) => {
            const progress = nativeEvent.progress;
            this.setState({
              progress: progress
            });

            if (progress === 1) {
              setTimeout(() => {
                this.setState({ progress: 0 });
              }, 600);
            }
          }}
        />
      </SafeAreaView>
    );
  }

  _onDidPressRightButton() {
    // exits webview
    this.props.navigation.goBack();
  }

  _onDidPressLeftButton() {
    // back button navigation inside webview
    this.webview.goBack();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayBackground
  }
});

export default WebViewScreen;
