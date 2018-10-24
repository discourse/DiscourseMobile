import React from "react";
import PropTypes from "prop-types";
import { Image, View, Text } from "react-native";
import style from "./stylesheet";
import { material } from "react-native-typography";
import Colors from "Root/colors";

export default class TopicComponent extends React.Component {
  render() {
    return (
      <View style={style.topic}>
        <Image
          style={style.topicMostRecentPoster}
          source={{ uri: this.props.topic.mostRecentPosterAvatar }}
        />

        <Text numberOfLines={1} style={[material.subheading, style.topicTitle]}>
          {this.props.topic.title}
        </Text>

        {this._renderTopicState(this.props.topic)}

        {this._renderPostsState(this.props.topic)}
      </View>
    );
  }

  _renderPostsState(topic) {
    if (
      topic.lastReadPostNumber &&
      topic.highestPostNumber - topic.lastReadPostNumber > 0
    ) {
      return (
        <View style={style.newPostsIndicator}>
          <Text style={[material.caption, { color: "white" }]}>
            {topic.highestPostNumber - topic.lastReadPostNumber}
          </Text>
        </View>
      );
    } else if (!topic.lastReadPostNumber) {
      return (
        <View style={style.unreadPostsIndicator}>
          <Text style={[material.caption, { color: Colors.grayUI }]}>
            {topic.highestPostNumber}
          </Text>
        </View>
      );
    }
  }

  _renderTopicState(topic) {
    if (!topic.lastReadPostNumber) {
      return <View style={style.newTopicIndicator} />;
    }
  }
}

TopicComponent.propTypes = {
  topic: PropTypes.object
};
