import React from "react";
import { Image, TouchableHighlight, View, Text } from "react-native";

import style from "./stylesheet";
import TopicsComponent from "Components/topics";
import TopTopic from "Models/top_topic";
import Colors from "../../colors";
import { material } from "react-native-typography";

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.site = props.site;

    this.state = {
      showMore: false
    };
  }

  // componentDidMount() {
  //   if (this.site.authToken) {
  //     this.setState({ isLoadingTopics: true });
  //
  //     TopTopic.startTracking(this.site).then(topics => {
  //       this.setState({ topics, isLoadingTopics: false });
  //     });
  //   }
  // }

  _renderShowMore() {
    if (this.state.showMore || this.props.site.topics.length <= 4) {
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

  _openNotifications() {
    this._openUserPage("notifications");
  }

  _openMessages() {
    this._openUserPage("messages");
  }

  _openUserPage(page) {
    const username = this.props.site.username;
    if (username) {
      const url = `${this.site.url}/u/${username}/${page}`;
      this.props.onOpenUrl(url, this.site.authToken);
    } else {
      this.props.onOpenUrl(this.site.url, this.site.authToken);
    }
  }

  _renderUnreadNotifications(unreadNotificationsCount) {
    if (unreadNotificationsCount > 0) {
      return (
        <TouchableHighlight
          underlayColor={"transparent"}
          onPress={this._openNotifications.bind(this)}
        >
          <View style={style.unreadNotifications}>
            <View style={style.unreadNotificationsCount}>
              <Text
                style={[material.caption, style.unreadNotificationsCountText]}
              >
                {unreadNotificationsCount}
              </Text>
            </View>
            <Text style={style.unreadNotificationsText}>notification(s)</Text>
          </View>
        </TouchableHighlight>
      );
    }
  }

  _renderUnreadPrivateMessages(unreadPrivateMessagesCount) {
    if (unreadPrivateMessagesCount > 0) {
      return (
        <TouchableHighlight
          underlayColor={"transparent"}
          onPress={this._openMessages.bind(this)}
        >
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
        </TouchableHighlight>
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
          {_renderNotificationSeparator(this.props.site.topics.length)}
          <View
            style={[
              style.notificationsCount,
              this.notificationsCountStyle(this.props.site.topics.length)
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
          onPress={() => this.props.onConnect(site)}
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
    } else {
      return { color: site.headerPrimaryColor };
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
        onPress={() => this.props.onOpenUrl(this.site.url, this.site.authToken)}
      >
        <View style={style.card}>
          <View
            style={[
              style.cardHeader,
              { backgroundColor: this.site.headerBackgroundColor },
              this.cardHeaderStyle(this.site)
            ]}
          >
            <View style={style.site}>
              <Image style={style.logo} source={{ uri: this.site.icon }} />
              <Text
                style={[
                  material.title,
                  style.title,
                  this.cardHeaderTitleStyle(this.site)
                ]}
              >
                {this.site.title}
              </Text>
            </View>

            {this._renderUnreadAndNew(this.site)}
            {this._renderConnect(this.site)}
          </View>
          <View
            style={[
              style.topics,
              this.topicsStyle(this.props.site.topics.length)
            ]}
          >
            <TopicsComponent
              isLoadingTopics={this.props.site.isLoadingTopics}
              site={this.site}
              showMore={this.state.showMore}
              topics={this.props.site.topics}
              onOpenUrl={this.props.onOpenUrl}
            />
            {this._renderShowMore()}
            {this._renderNotifications(this.site)}
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}
