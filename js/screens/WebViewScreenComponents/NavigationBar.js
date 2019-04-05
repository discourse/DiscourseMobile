/* @flow */
"use strict";

import React from "react";

import PropTypes from "prop-types";

import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View
} from "react-native";

import { SafeAreaView } from "react-navigation";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";

import ProgressBar from "../../ProgressBar";
import colors from "../../colors";

class NavigationBar extends React.Component {
  static propTypes = {
    onDidPressLeftButton: PropTypes.func,
    onDidPressRightButton: PropTypes.func
  };

  state = {
    headerAnim: new Animated.Value(Platform.OS === "ios" ? 44 : 55)
  };

  componentWillUpdate(nextProps) {
    if (nextProps.scrollDirection !== this.props.scrollDirection) {
      let toValue = 0;
      if (nextProps.scrollDirection === "up") {
        toValue = Platform.OS === "ios" ? 44 : 55;
      }

      Animated.timing(this.state.headerAnim, {
        toValue: toValue,
        duration: 300
      }).start();
    }
  }

  render() {
    let { headerAnim } = this.state;

    return (
      <Animated.View
        style={{ ...styles.container, height: headerAnim }}
        forceInset={{ top: "always", bottom: "never" }}
      >
        <ProgressBar progress={this.props.progress} />
        <View style={styles.leftContainer}>
          {this._renderButton(this.props.onDidPressLeftButton, "angle-left")}
        </View>
        <View style={styles.titleContainer} />
        <View style={styles.rightContainer}>
          {this._renderButton(this.props.onDidPressRightButton, "times")}
        </View>
        <View style={styles.separator} />
      </Animated.View>
    );
  }

  _renderButton(callback, iconName) {
    return (
      <TouchableHighlight
        underlayColor={"transparent"}
        style={styles.button}
        onPress={callback}
      >
        <FontAwesome5 name={iconName} size={20} color={colors.grayUI} />
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.grayBackground,
    flexDirection: "row"
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
