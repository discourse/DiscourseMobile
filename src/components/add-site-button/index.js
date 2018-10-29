import React from "react";
import { TouchableHighlight, View, Text } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import style from "./stylesheet";

export default class extends React.Component {
  render() {
    if (this.props.sitesLength === 0) {
      return <View />;
    } else {
      return (
        <TouchableHighlight
          style={style.outterButton}
          underlayColor={"transparent"}
          onPress={() => this.props.onPress()}
        >
          <View style={style.button}>
            <Text>
              <Icon name="plus" style={style.icon} size={22} />
            </Text>
          </View>
        </TouchableHighlight>
      );
    }
  }
}
