import React from "react";
import {
  Image,
  TouchableOpacity,
  TouchableHighlight,
  View,
  Text
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import style from "./stylesheet";
import { material } from "react-native-typography";

export default class extends React.Component {
  onPress() {
    this.props.navigation.getParam("onPress")();
  }

  render() {
    return (
      <TouchableHighlight>
        <View style={style.card}>
          <Image style={style.logo} source={require("./nav-icon-gray.png")} />

          <Text style={[style.text, material.body1]}>
            You don’t have any sites yet.
            {"\n"}
            Add Discourse sites to keep track of.
          </Text>

          <TouchableOpacity>
            <Text style={[material.button, style.addSiteButtonText]}>
              Add your first site
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableHighlight>
    );
  }
}
