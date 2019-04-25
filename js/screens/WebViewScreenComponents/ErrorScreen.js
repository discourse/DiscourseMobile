/* @flow */
"use strict";

import React from "react";

import PropTypes from "prop-types";

import { StyleSheet, Text, TouchableHighlight, View } from "react-native";

import Icon from "react-native-vector-icons/Ionicons";
import colors from "../../colors";
import { SafeAreaView } from "react-navigation";

class ErrorScreen extends React.Component {
  static propTypes = {
    onRefresh: PropTypes.func,
    onClose: PropTypes.func
  };

  render() {
    let { errorName, errorData } = this.props;
    return (
      <SafeAreaView
        style={styles.container}
        forceInset={{ top: "always", bottom: "always" }}
      >
        <View style={styles.box}>
          <View style={styles.errorHeading}>
            <Text style={{ fontSize: 24 }}>Oops, there was an error.</Text>
          </View>
          <View style={styles.section}>
            <Text>
              {errorData && errorData.description
                ? errorData.description
                : errorName}
            </Text>
          </View>
          <View style={styles.section}>
            {this._renderButton(this.props.onRefresh, "ios-refresh")}
            {this._renderButton(this.props.onClose, "ios-close-circle-outline")}
          </View>
        </View>
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
        <Icon name={iconName} size={42} />
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    backgroundColor: colors.grayBackground
  },
  box: {
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    height: "50%",
    backgroundColor: "white",
    padding: 10
  },
  section: {
    flexDirection: "row",
    margin: 10
  },
  button: {
    padding: 20,
    flex: 1,
    alignItems: "center"
  }
});

export default ErrorScreen;
