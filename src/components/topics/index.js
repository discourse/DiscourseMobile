import React from "react";
import { TouchableHighlight, SectionList } from "react-native";
import style from "./stylesheet";
import Colors from "Root/colors";
import FakeTopicComponent from "Components/fake-topic";
import TopicComponent from "Components/topic";

export default class extends React.Component {
  constructor(props) {
    super(props);
  }

  openUrl(item) {
    const url = `${this.props.site.url}/t/${item.id}`;
    this.props.onOpenUrl(url, this.props.site.authToken);
  }

  render() {
    return (
      <SectionList
        renderItem={({ item, index, section }) => {
          if (this.props.isLoadingTopics) {
            return <FakeTopicComponent />;
          } else {
            return (
              <TouchableHighlight
                key={index}
                style={style.touchableTopic}
                activeOpacity={0.8}
                underlayColor={Colors.yellowUIFeedback}
                onPress={() => this.openUrl(item)}
              >
                <TopicComponent topic={item} />
              </TouchableHighlight>
            );
          }
        }}
        sections={[
          {
            data: this.props.isLoadingTopics
              ? [0, 1, 2, 3]
              : this._displayedTopics()
          }
        ]}
        keyExtractor={(item, index) => `${index}-${item.id}`}
      />
    );
  }

  _displayedTopics() {
    if (this.props.showMore) {
      return this.props.topics;
    }

    return this.props.topics.slice(0, 4);
  }
}
