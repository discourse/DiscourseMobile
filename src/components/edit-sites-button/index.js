import React from "react";
import PropTypes from "prop-types";
import { TouchableHighlight, View, Text } from "react-native";
import style from "./stylesheet";
import Colors from "Root/colors";
import { material } from "react-native-typography";

export default class EditSitesButtonComponent extends React.Component {
  render() {
    return (
      <View style={style.wrapper}>
        <TouchableHighlight
          style={style.button}
          underlayColor={Colors.yellowUIFeedback}
          onPress={this.props.onPress}
        >
          <Text style={[material.button, style.buttonText]}>Edit sites</Text>
        </TouchableHighlight>
      </View>
    );
  }
}

EditSitesButtonComponent.propTypes = {
  onPress: PropTypes.func
};
