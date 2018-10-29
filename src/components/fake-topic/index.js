import React from "react";
import { View } from "react-native";
import style from "./stylesheet";

export default class extends React.Component {
  render() {
    return (
      <View style={style.topic}>
        <View style={style.avatar} />
        <View
          style={[
            style.title,
            {
              width: "85%"
            }
          ]}
        />
      </View>
    );
  }
}
