/* @flow */
"use strict";

import React from "react";
import {
  StyleSheet,
  TouchableHighlight,
  Text,
  Switch,
  View
} from "react-native";
import AsyncStorage from "@react-native-community/async-storage";

class Overlay extends React.Component {
  constructor(props) {
    super(props);

    this.state = { useWebView: false };

    this.toggleSwitch = value => {
      AsyncStorage.setItem("@Discourse.useWebView", JSON.stringify(value)).then(
        v => {
          this.setState({ useWebView: value });
        }
      );
    };

    AsyncStorage.getItem("@Discourse.useWebView").then(value => {
      this.setState({ useWebView: JSON.parse(value) });
    });
  }

  render() {
    return (
      <TouchableHighlight
        onPress={this.props.onOverlayClick}
        style={styles.overlay}
      >
        <View style={styles.inner}>
          <Text style={styles.text}>Experimental: Use WebView browser</Text>
          <Switch
            style={{ marginTop: 10 }}
            onValueChange={this.toggleSwitch}
            value={this.state.useWebView}
          />
        </View>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  inner: {
    color: "#777",
    fontSize: 15,
    margin: 20,
    padding: 20,
    backgroundColor: "white"
  }
});

export default Overlay;
