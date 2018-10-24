import React from "react";
import { Image, TouchableHighlight, View, Text } from "react-native";
import PropTypes from "prop-types";
import style from "./stylesheet";
import TopicsComponent from "Components/topics";
import Colors from "Root/colors";
import { material } from "react-native-typography";
import Icon from "react-native-vector-icons/FontAwesome";
import I18n from "I18n";

export default class CardComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: props.site.isLoading,
      isExpanded: false,
      totalUnread: props.site.totalUnread,
      totalNew: props.site.totalNew
    };
  }

  componentDidMount() {
    this.props.site.subscribe(this.onChangeSite.bind(this));
  }

  componentWillUnmount() {
    this.props.site.unsubscribe(this.onChangeSite.bind(this));
  }

  onChangeSite(state) {
    this.setState({
      isLoading: state.isLoading || false,
      totalUnread: state.totalUnread || this.props.site.totalUnread,
      totalNew: state.totalNew || this.props.site.totalNew
    });
  }

  _onPressCard() {
    if (this.props.site.authToken) {
      this.props.site.shouldRefreshOnEnterForeground = true;
      return this.props.onOpenUrl(this.props.site.url);
    } else {
      return this.props.onConnect(this.props.site);
    }
  }

  _renderShowMore() {
    if (this.state.isExpanded || this.props.site.topics.length <= 4) {
      return;
    }

    return (
      <View style={style.showMore}>
        <TouchableHighlight
          style={style.showMoreButtonWrapper}
          underlayColor={Colors.yellowUIFeedback}
          onPress={() => this.setState({ isExpanded: true })}
        >
          <Icon name="angle-down" style={style.icon} size={16} />
        </TouchableHighlight>
      </View>
    );
  }

  _renderShowCollapse() {
    if (!this.state.isExpanded || this.props.site.topics.length <= 4) {
      return;
    }

    return (
      <View style={style.showMore}>
        <TouchableHighlight
          underlayColor={Colors.yellowUIFeedback}
          style={style.showMoreButtonWrapper}
          onPress={() => this.setState({ isExpanded: false })}
        >
          <Icon name="angle-up" style={style.icon} size={16} />
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
      const url = `${this.props.site.url}/u/${username}/${page}`;
      this.props.onOpenUrl(url);
    } else {
      this.props.onOpenUrl(this.props.site.url);
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
            <Text style={style.unreadNotificationsText}>
              {I18n.t("notifications", { count: unreadNotificationsCount })}
            </Text>
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
            <Text style={style.unreadPrivateMessagesText}>
              {I18n.t("private_messages", {
                count: unreadPrivateMessagesCount
              })}
            </Text>
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

    if (
      this.props.site.topics.length > 4 ||
      site.unreadNotifications > 0 ||
      site.unreadPrivateMessages > 0
    ) {
      return (
        <View
          style={[
            style.notifications,
            this.notificationsStyle(this.props.site.topics.length)
          ]}
        >
          {_renderNotificationSeparator(this.props.site.topics.length)}
          <View style={[style.notificationsCount]}>
            {this._renderUnreadNotifications(site.unreadNotifications)}
            {this._renderUnreadPrivateMessages(site.unreadPrivateMessages)}

            {this._renderShowMore()}
            {this._renderShowCollapse()}
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
          onPress={() => this._onPressCard()}
        >
          <View style={style.connectButton}>
            <Text style={[material.button, style.connectButtonText]}>
              {I18n.t("connect")}
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

    if (back === "#ffffff") {
      back = Colors.grayBackground;
    }

    let styles = {
      backgroundColor: back
    };

    return styles;
  }

  cardHeaderTitleStyle(site) {
    return { color: site.headerPrimaryColor };
  }

  notificationsStyle(topicsLength) {
    if (!topicsLength) {
      return {
        marginTop: 10
      };
    }
  }

  topicsStyle(topicsLength) {
    if (topicsLength) {
      return {
        marginTop: 5
      };
    }
  }

  cardStyle(site) {
    let styles = {};
    return styles;
  }

  _renderUnreadAndNew() {
    const values = [
      this.state.totalNew > 0 ? `${this.state.totalNew} new` : null,
      this.state.totalUnread > 0 ? `${this.state.totalUnread} unread` : null
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
        onPress={() => this._onPressCard()}
      >
        <View style={[style.card, this.cardStyle(this.props.site)]}>
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

            {this._renderUnreadAndNew()}
            {this._renderConnect(this.props.site)}
          </View>
          <View
            style={[
              style.topics,
              this.topicsStyle(this.props.site.topics.length)
            ]}
          >
            <TopicsComponent
              isLoading={this.state.isLoading}
              site={this.props.site}
              isExpanded={this.state.isExpanded}
              topics={this.props.site.topics}
              onOpenUrl={this.props.onOpenUrl}
            />
            {this._renderNotifications(this.props.site)}
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

CardComponent.propTypes = {
  site: PropTypes.object,
  onOpenUrl: PropTypes.func,
  onConnect: PropTypes.func
};
