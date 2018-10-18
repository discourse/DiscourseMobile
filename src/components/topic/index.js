import React from "react";
import { Image, View, Text } from "react-native";
import style from "./stylesheet";
import { material } from "react-native-typography";

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.topic = props.topic;
  }

  render() {
    return (
      <View style={style.topic}>
        {this._renderTopicState(this.topic)}
        <Text numberOfLines={1} style={[material.body1, style.topicTitle]}>
          {this.topic.title}
        </Text>
        {this._renderPostsState(this.topic)}

        <Image
          style={style.topicMostRecentPoster}
          source={{ uri: this.topic.mostRecentPosterAvatar }}
        />
      </View>
    );
  }

  _renderPostsState(topic) {
    if (topic.newPosts) {
      return (
        <View style={style.newPostsIndicator}>
          <Text style={[material.caption, { color: "white" }]}>
            {topic.newPosts}
          </Text>
        </View>
      );
    } else if (topic.unreadPosts) {
      return (
        <View style={style.unreadPostsIndicator}>
          <Text style={[material.caption, { color: "black" }]}>
            {topic.unreadPosts}
          </Text>
        </View>
      );
    }
  }

  _renderTopicState(topic) {
    if (topic.unreadPosts && !topic.newPosts) {
      return <View style={style.newTopicIndicator} />;
    }
  }
}
