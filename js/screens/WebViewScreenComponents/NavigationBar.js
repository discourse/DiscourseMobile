/* @flow */
"use strict";

import React from "react";

import PropTypes from "prop-types";

import {
  Animated,
  StyleSheet,
  Text,
  TouchableHighlight,
  View
} from "react-native";

import Icon from "react-native-vector-icons/Ionicons";
import colors from "../../colors";

class NavigationBar extends React.Component {
  static propTypes = {
    onDidPressLeftButton: PropTypes.func,
    onDidPressRightButton: PropTypes.func
  };

  state = {
    heightAnim: new Animated.Value(this.props.isIphoneX() ? 70 : 50),
    paddingAnim: new Animated.Value(this.props.isIphoneX() ? 24 : 0),
    bgAnim: new Animated.Value(0)
  };

  componentWillUpdate(nextProps) {
    if (nextProps.scrollDirection !== this.props.scrollDirection) {
      let heightValue = 0;
      let paddingValue = 0;
      if (nextProps.scrollDirection === "up") {
        heightValue = this.props.isIphoneX() ? 70 : 50;
        paddingValue = this.props.isIphoneX() ? 24 : 0;
      }

      Animated.parallel([
        Animated.timing(this.state.heightAnim, {
          toValue: heightValue,
          duration: 250
        }),
        Animated.timing(this.state.paddingAnim, {
          toValue: paddingValue,
          duration: 250
        })
      ]).start();
    }

    if (nextProps.headerBg !== this.props.headerBg) {
      Animated.timing(this.state.bgAnim, {
        toValue: 1,
        duration: 250
      }).start();
    }
  }

  render() {
    let { heightAnim, paddingAnim, bgAnim } = this.state;

    return (
      <Animated.View
        style={{
          ...styles.container,
          height: heightAnim,
          paddingBottom: paddingAnim,
          backgroundColor: bgAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.grayBackground, this.props.headerBg]
          }),
          shadowColor: this.props.headerShadowColor,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.75
        }}
      >
        {this._renderButton(
          this.props.onDidPressBackButton,
          "ios-arrow-back",
          !this.props.canGoBack
        )}
        {this._renderButton(
          this.props.onDidPressForwardButton,
          "ios-arrow-forward",
          !this.props.canGoForward
        )}
        {this._renderButton(this.props.onDidPressShareButton, "ios-share")}
        {this._renderButton(this.props.onDidPressCloseButton, "ios-arrow-down")}
      </Animated.View>
    );
  }

  _renderButton(callback, iconName, disabled = false) {
    return (
      <TouchableHighlight
        underlayColor={"transparent"}
        style={{
          ...styles.button,
          opacity: disabled ? 0.5 : 1
        }}
        onPress={callback}
        disabled={disabled}
      >
        <Icon name={iconName} size={26} color={this.props.buttonColor} />
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  },
  button: {
    paddingTop: 6,
    flex: 1,
    alignItems: "center"
  }
});

export default NavigationBar;
