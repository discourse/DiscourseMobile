import React from "react";
import { Image, View, Text } from "react-native";
import style from "./stylesheet";
import { material } from "react-native-typography";

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.topic = this.props.topic;
  }

  componentDidMount() {}

  render() {
    return (
      <View style={style.topic}>
        {this._renderTopicState(this.topic)}
        <Text numberOfLines={1} style={[material.body1, style.topicTitle]}>
          {this.topic.title}
        </Text>
        <Image
          style={style.topicMostRecentPoster}
          source={{ uri: this.topic.mostRecentPosterAvatar }}
        />
      </View>
    );
  }

  _renderTopicState(topic) {
    if (!topic.unreadPosts && topic.new) {
      return <View style={style.newTopicIndicator} />;
    } else if (topic.unreadPosts && topic.new) {
      return (
        <View style={style.newTopicIndicatorWithUnread}>
          <Text style={[material.caption, { color: "white" }]}>
            {topic.unreadPosts}
          </Text>
        </View>
      );
    } else if (topic.unreadPosts && !topic.new) {
      return (
        <View style={style.unreadTopicIndicator}>
          <Text style={[material.caption, { color: "black" }]}>
            {topic.unreadPosts}
          </Text>
        </View>
      );
    }
  }
}
