/* @flow */
"use strict";

import React from "react";

import PropTypes from "prop-types";

import {
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View
} from "react-native";

import { SafeAreaView } from "react-navigation";
import Icon from "react-native-vector-icons/FontAwesome";

import ProgressBar from "../../ProgressBar";
import colors from "../../colors";

class NavigationBar extends React.Component {
  static propTypes = {
    onDidPressLeftButton: PropTypes.func,
    onDidPressRightButton: PropTypes.func
  };

  render() {
    return (
      <SafeAreaView
        style={styles.container}
        forceInset={{ top: "always", bottom: "never" }}
      >
        <ProgressBar progress={this.props.progress} />
        <View style={styles.leftContainer}>
          {this._renderButton(this.props.onDidPressLeftButton, "angle-left")}
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title} />
        </View>
        <View style={styles.rightContainer}>
          {this._renderButton(this.props.onDidPressRightButton, "close")}
        </View>
        <View style={styles.separator} />
      </SafeAreaView>
    );
  }

  _renderButton(callback, iconName) {
    return (
      <TouchableHighlight
        underlayColor={"transparent"}
        style={styles.button}
        onPress={callback}
      >
        <Icon name={iconName} size={20} color={colors.grayUI} />
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.grayBackground,
    flexDirection: "row",
    height: Platform.OS === "ios" ? 44 : 55
  },
  leftContainer: {
    flex: 1
  },
  rightContainer: {
    flex: 1,
    alignItems: "flex-end"
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  separator: {
    height: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.grayBackground
  },
  title: {
    color: colors.grayUI,
    fontSize: 16
  },
  button: {
    width: Platform.OS === "ios" ? 44 : 55,
    height: Platform.OS === "ios" ? 44 : 55,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default NavigationBar;
