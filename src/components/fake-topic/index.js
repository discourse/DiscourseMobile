import React from "react";
import { View } from "react-native";
import style from "./stylesheet";

export default class extends React.Component {
  render() {
    return (
      <View style={style.topic}>
        <View
          style={[
            style.title,
            {
              width: Math.floor(Math.random() * (280 - 120 + 1)) + 120
            }
          ]}
        />
        <View style={style.avatar} />
      </View>
    );
  }
}
