import React from "react";
import UrlParser from "url";
import { TouchableHighlight, View, Text } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import style from "./stylesheet";
import { material } from "react-native-typography";
import Colors from "Root/colors";

export default class extends React.Component {
  render() {
    return (
      <TouchableHighlight
        underlayColor={Colors.yellowUIFeedback}
        {...this.props.sortHandlers}
      >
        <View style={style.row}>
          <View style={style.left}>
            <TouchableHighlight
              onPress={this.props.onRemoveSite}
              underlayColor={"transparent"}
              style={{ padding: 15 }}
            >
              <View>
                <Icon name="trash" style={style.trashIcon} size={22} />
              </View>
            </TouchableHighlight>
          </View>
          <View style={style.right}>
            <Text style={[material.title, style.title]}>
              {this.props.site.title}
            </Text>
            <Text style={[material.subheading, style.subtitle]}>
              {this._renderSubtitle()}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  }

  _renderSubtitle() {
    return UrlParser.parse(this.props.site.url).host;
  }
}
