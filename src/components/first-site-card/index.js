import React from "react";
import { Image, TouchableHighlight, View, Text } from "react-native";
import style from "./stylesheet";
import { material } from "react-native-typography";

export default class extends React.Component {
  render() {
    return (
      <TouchableHighlight onPress={() => this.props.onPress()}>
        <View style={style.card}>
          <Image style={style.logo} source={require("./nav-icon-gray.png")} />

          <Text style={[style.text, material.body1]}>
            You don’t have any sites yet.
            {"\n"}
            Add Discourse sites to keep track of.
          </Text>

          <Text style={[material.button, style.addSiteButtonText]}>
            Add your first site
          </Text>
        </View>
      </TouchableHighlight>
    );
  }
}
