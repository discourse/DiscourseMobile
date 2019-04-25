/* @flow */
"use strict";

import React from "react";

import { StyleSheet, Text, View } from "react-native";

import FontAwesome5 from "react-native-vector-icons/FontAwesome5";

import colors from "../../colors";

class EmptyNotificationsView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <FontAwesome5 name={"bell"} size={26} color={colors.grayUI} solid />
        <Text style={styles.text}>{this.props.text}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "transparent",
    flex: 5,
    justifyContent: "center"
  },
  text: {
    color: colors.grayTitle,
    fontSize: 16,
    marginBottom: 48,
    padding: 24,
    paddingTop: 12,
    textAlign: "center"
  }
});

export default EmptyNotificationsView;
