import React from "react";
import {
  Image,
  TouchableOpacity,
  TouchableHighlight,
  View,
  Text,
  SectionList
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import style from "./stylesheet";
import TopicComponent from "../topic";
import TopTopic from "../../models/top_topic";
import Colors from "../../colors";
import { material } from "react-native-typography";

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoadingTopics: false,
      topics: [],
      showMore: false
    };
  }

  componentDidMount() {
    if (this.props.site.authToken) {
      this.setState({ isLoadingTopics: true });

      TopTopic.startTracking(this.props.site).then(topics => {
        this.setState({ topics, isLoadingTopics: false });
      });
    }
  }

  _displayedTopics() {
    if (this.state.showMore) {
      return this.state.topics;
    }

    return this.state.topics.slice(0, 4);
  }

  _renderShowMore() {
    if (this.state.showMore || this.state.topics.length <= 4) {
      return;
    }

    return (
      <View style={style.showMore}>
        <TouchableHighlight
          style={style.showMoreButtonWrapper}
          onPress={() => this.setState({ showMore: true })}
        >
          <Text style={[material.button, style.showMoreButton]}>Show more</Text>
        </TouchableHighlight>
      </View>
    );
  }

  _renderUnreadNotifications(unreadNotificationsCount) {
    unreadNotificationsCount = 2;
    if (unreadNotificationsCount > 0) {
      return (
        <View style={style.unreadNotifications}>
          <View style={style.unreadNotificationsCount}>
            <Text
              style={[material.caption, style.unreadNotificationsCountText]}
            >
              {unreadNotificationsCount}
            </Text>
          </View>
          <Text style={style.unreadNotificationsText}>message(s)</Text>
        </View>
      );
    }
  }

  _renderUnreadPrivateMessages(unreadPrivateMessagesCount) {
    if (unreadPrivateMessagesCount > 0) {
      return (
        <View style={style.unreadPrivateMessages}>
          <View style={style.unreadPrivateMessagesCount}>
            <Text
              style={[material.caption, style.unreadPrivateMessagesCountText]}
            >
              {unreadPrivateMessagesCount}
            </Text>
          </View>
          <Text style={style.unreadPrivateMessagesText}>message(s)</Text>
        </View>
      );
    }
  }

  _renderNotifications(site) {
    const _renderNotificationSeparator = topicsLength => {
      if (topicsLength) {
        return <View style={style.notificationsSeparator} />;
      }
    };

    if (site.unreadNotifications > 0 || site.unreadPrivateMessages > 0) {
      return (
        <View style={style.notifications}>
          {_renderNotificationSeparator(this.state.topics.length)}
          <View
            style={[
              style.notificationsCount,
              this.notificationsCountStyle(this.state.topics.length)
            ]}
          >
            {this._renderUnreadNotifications(site.unreadNotifications)}
            {this._renderUnreadPrivateMessages(site.unreadPrivateMessages)}
          </View>
        </View>
      );
    }
  }

  _renderConnect(site) {
    if (site.authToken) {
      return;
    }

    return (
      <View style={[style.connect]}>
        <TouchableHighlight
          style={style.connectButtonWrapper}
          onPress={() => this.props.onPressConnect(site)}
        >
          <View style={style.connectButton}>
            <Text style={[material.button, style.connectButtonText]}>
              Connect
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }

  cardHeaderStyle(site) {
    if (!site.authToken) {
      return {};
    }

    let back = site.headerBackgroundColor || Colors.grayBackground;

    if (site.url === "https://www.minerva-group.org") {
      back = "#d97d49";
    }

    if (back === "#ffffff") {
      back = Colors.grayBackground;
    }

    let styles = {
      borderTopLeftRadius: 5,
      borderBottomLeftRadius: 5,
      borderTopRightRadius: 5,
      borderBottomRightRadius: 5,
      backgroundColor: back
    };

    if (site.authToken) {
      styles.borderBottomLeftRadius = 0;
      styles.borderBottomRightRadius = 0;
    }

    return styles;
  }

  cardHeaderTitleStyle(site) {
    if (site.url === "https://www.minerva-group.org") {
      return { color: "white" };
    }
  }

  notificationsCountStyle(topicsLength) {
    if (!topicsLength) {
      return {
        marginVertical: 10
      };
    }
  }

  topicsStyle(topicsLength) {
    if (topicsLength) {
      return {
        marginVertical: 10
      };
    }
  }

  _renderUnreadAndNew(site) {
    const values = [
      site.totalNew > 0 ? `${site.totalNew} new` : null,
      site.totalUnread > 0 ? `${site.totalUnread} unread` : null
    ].filter(x => x);
    return (
      <Text style={[material.caption, style.unreadAndNew]}>
        {values.join(" | ")}
      </Text>
    );
  }

  render() {
    return (
      <TouchableHighlight
        activeOpacity={0.8}
        underlayColor={"transparent"}
        onPress={() =>
          this.props.onOpenUrl(this.props.site.url, this.props.site.authToken)
        }
      >
        <View style={style.card}>
          <View
            style={[
              style.cardHeader,
              { backgroundColor: this.props.site.headerBackgroundColor },
              this.cardHeaderStyle(this.props.site)
            ]}
          >
            <View style={style.site}>
              <Image
                style={style.logo}
                source={{ uri: this.props.site.icon }}
              />
              <Text
                style={[
                  material.title,
                  style.title,
                  this.cardHeaderTitleStyle(this.props.site)
                ]}
              >
                {this.props.site.title}
              </Text>
            </View>

            {this._renderUnreadAndNew(this.props.site)}
            {this._renderConnect(this.props.site)}
          </View>
          <View
            style={[style.topics, this.topicsStyle(this.state.topics.length)]}
          >
            <SectionList
              renderItem={({ item, index, section }) => {
                if (this.state.isLoadingTopics) {
                  return (
                    <View style={style.fakeTopic}>
                      <View
                        style={[
                          style.fakeTopicTitle,
                          {
                            width:
                              Math.floor(Math.random() * (280 - 120 + 1)) + 120
                          }
                        ]}
                      />
                      <View style={style.fakeTopicAvatar} />
                    </View>
                  );
                } else {
                  return (
                    <TouchableHighlight
                      key={index}
                      style={style.touchableTopic}
                      activeOpacity={0.8}
                      underlayColor={Colors.yellowUIFeedback}
                      onPress={() =>
                        this.props.onOpenUrl(
                          `${this.props.site.url}/t/${item.id}`,
                          this.props.site.authToken
                        )
                      }
                    >
                      <TopicComponent topic={item} />
                    </TouchableHighlight>
                  );
                }
              }}
              sections={[
                {
                  title: "Title1",
                  data: this.state.isLoadingTopics
                    ? [0, 1, 2, 3]
                    : this._displayedTopics()
                }
              ]}
              keyExtractor={(item, index) => `${index}-${item.id}`}
            />
            {this._renderShowMore()}
            {this._renderNotifications(this.props.site)}
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}
