/* @flow */
'use strict';

import React from 'react';
import {Image, StyleSheet, Text, TouchableHighlight, View} from 'react-native';
import {SwipeRow} from 'react-native-swipe-list-view';
import Notification from './Notification';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {ThemeContext} from '../../ThemeContext';
import i18n from 'i18n-js';

class SiteRow extends React.Component {
  render() {
    const theme = this.context;

    let iconPath = this.props.site.icon
      ? {uri: this.props.site.icon}
      : require('../../../img/nav-icon-gray.png');
    return (
      <SwipeRow
        disableRightSwipe={true}
        rightOpenValue={-80}
        recalculateHiddenLayout={true}
        style={{backgroundColor: theme.redDanger}}>
        <View style={{...styles.hiddenRow}}>
          <TouchableHighlight
            style={{paddingHorizontal: 28, backgroundColor: theme.redDanger}}
            underlayColor={theme.redDanger}
            onPress={this.props.onDelete}
            {...this.props.sortHandlers}>
            <FontAwesome5
              name={'trash-alt'}
              size={24}
              color={theme.buttonTextColor}
            />
          </TouchableHighlight>
        </View>
        <View style={{backgroundColor: theme.background}}>
          <TouchableHighlight
            underlayColor={theme.yellowUIFeedback}
            onPress={() => this.props.onClick()}
            onLongPress={() => this.props.onLongPress()}
            {...this.props.sortHandlers}>
            <View
              accessibilityTraits="link"
              style={{...styles.row, borderBottomColor: theme.grayBorder}}>
              <Image style={styles.icon} source={iconPath} />
              <View style={styles.info}>
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={{...styles.url, color: theme.grayTitle}}>
                  {this.props.site.url.replace(/^https?:\/\//, '')}
                </Text>
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={2}
                  style={{...styles.description, color: theme.graySubtitle}}>
                  {this.props.site.description}
                </Text>
                {this._renderCounts(this.props.site)}
              </View>
              {this._renderShouldLogin(this.props.site)}
              {this._renderNotifications(this.props.site)}
            </View>
          </TouchableHighlight>
        </View>
      </SwipeRow>
    );
  }

  _renderNotifications(site) {
    const theme = this.context;

    if (site.authToken) {
      return (
        <View style={styles.notifications}>
          <Notification color={theme.redDanger} count={site.flagCount} />
          <Notification
            color={theme.greenPrivateUnread}
            count={site.unreadPrivateMessages}
          />
          <Notification
            color={theme.blueUnread}
            count={site.unreadNotifications}
          />
        </View>
      );
    }
  }

  _renderShouldLogin(site) {
    const theme = this.context;

    if (!site.authToken) {
      return (
        <TouchableHighlight
          style={styles.notifications}
          underlayColor={theme.background}
          onPress={() => this.props.onClickConnect()}>
          <Text
            style={{
              ...styles.connect,
              backgroundColor: theme.blueCallToAction,
              color: theme.buttonTextColor,
            }}>
            {i18n.t('connect')}
          </Text>
        </TouchableHighlight>
      );
    }
  }

  _renderCounts(site) {
    var counts = {};

    if (site.authToken) {
      if (site.totalNew > 0) {
        counts.new = {
          link: '/new',
          text: i18n.t('new_with_count', {count: site.totalNew}),
        };
      }
      if (site.totalUnread > 0) {
        counts.unread = {
          link: '/unread',
          text: i18n.t('unread_with_count', {count: site.totalUnread}),
        };
      }
    }

    if (site.groupInboxes && site.groupInboxes.length > 0) {
      site.groupInboxes.sort(function (a, b) {
        if (a.group_name && b.group_name) {
          return a.group_name.localeCompare(b.group_name);
        } else {
          return true;
        }
      });
      site.groupInboxes.forEach(group => {
        if (group.inbox_count !== undefined) {
          counts[group.group_name] = {
            link: `/u/${group.username}/messages/group/${group.group_name}`,
            text: `${group.group_name} (${group.inbox_count})`,
          };
        }
      });
    }

    const countButtons = Object.keys(counts).map(function (key) {
      return counts[key];
    });

    if (countButtons.length > 0) {
      return (
        <View style={styles.counts}>
          {countButtons.map((value, index) => {
            return this._renderCountItem(value, index);
          })}
        </View>
      );
    }
  }

  _renderCountItem(item, index) {
    const theme = this.context;
    return (
      <TouchableHighlight
        key={index}
        style={styles.countItem}
        underlayColor={theme.yellowUIFeedback}
        onPress={() => this.props.onClick(item.link)}>
        <Text style={{color: theme.blueUnread, fontSize: 15}}>{item.text}</Text>
      </TouchableHighlight>
    );
  }
}

SiteRow.contextType = ThemeContext;

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 12,
  },
  hiddenRow: {
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  icon: {
    alignSelf: 'flex-start',
    height: 40,
    width: 40,
    marginTop: 3,
  },
  info: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  url: {
    fontSize: 16,
    fontWeight: 'normal',
    paddingLeft: 6,
  },
  description: {
    flex: 10,
    fontSize: 14,
    paddingLeft: 6,
    paddingTop: 6,
  },
  notifications: {
    flexDirection: 'row',
    paddingLeft: 12,
  },
  connect: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    marginBottom: 6,
    overflow: 'hidden',
    padding: 6,
    borderRadius: 6,
  },
  counts: {
    marginTop: 6,
    flexDirection: 'row',
    display: 'flex',
    flexWrap: 'wrap',
  },
  countItem: {
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
});

export default SiteRow;
