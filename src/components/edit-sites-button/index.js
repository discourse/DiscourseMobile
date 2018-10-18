import React from "react";
import { TouchableHighlight, View, Text } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import style from "./stylesheet";

export default class extends React.Component {
  render() {
    return (
      <TouchableHighlight
        style={style.wrapper}
        onPress={() => this.props.onPress()}
      >
        <View style={style.button}>
          <Text style={style.buttonText}>Edit sites</Text>
        </View>
      </TouchableHighlight>
    );
  }
}
