import React from "react";
import PropTypes from "prop-types";
import { TouchableHighlight, SectionList } from "react-native";
import style from "./stylesheet";
import Colors from "Root/colors";
import FakeTopicComponent from "Components/fake-topic";
import TopicComponent from "Components/topic";

export default class TopicsComponent extends React.Component {
  openUrl(topic) {
    this.props.site.shouldRefreshOnEnterForeground = true;

    let url = `${this.props.site.url}/t/${topic.id}`;

    const lastReadPostNumber = topic.lastReadPostNumber;
    if (lastReadPostNumber) {
      url += `/${lastReadPostNumber + 1}`;
    }

    this.props.onOpenUrl(url);
  }

  render() {
    return (
      <SectionList
        renderItem={({ item, index, section }) => {
          if (this.props.isLoading) {
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
            data: this.props.isLoading ? [0, 1, 2, 3] : this._displayedTopics()
          }
        ]}
        keyExtractor={(item, index) => `${index}-${item.id}`}
      />
    );
  }

  _displayedTopics() {
    if (this.props.isExpanded) {
      return this.props.topics;
    }

    return this.props.topics.slice(0, 4);
  }
}

TopicsComponent.propTypes = {
  isLoading: PropTypes.bool,
  isExpanded: PropTypes.bool,
  topics: PropTypes.array,
  site: PropTypes.object,
  onOpenUrl: PropTypes.func
};
