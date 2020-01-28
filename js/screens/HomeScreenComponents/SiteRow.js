/* @flow */
'use strict';

import React from 'react';
import {Image, StyleSheet, Text, TouchableHighlight, View} from 'react-native';

import {SwipeRow} from 'react-native-swipe-list-view';
import Notification from './Notification';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {ThemeContext} from '../../ThemeContext';

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
        <View style={styles.notifications}>
          <Text
            style={{
              ...styles.connect,
              backgroundColor: theme.blueCallToAction,
              color: theme.buttonTextColor,
            }}>
            connect
          </Text>
        </View>
      );
    }
  }

  _renderCounts(site) {
    var counts = [];
    const theme = this.context;
    if (site.authToken) {
      if (site.totalNew > 0) {
        counts.push('new (' + site.totalNew + ')');
      }
      if (site.totalUnread > 0) {
        counts.push('unread (' + site.totalUnread + ')');
      }
    }

    if (counts.length > 0) {
      return (
        <View style={styles.counts}>
          <Text style={{color: theme.blueUnread}}>{counts.join('  ')}</Text>
        </View>
      );
    }
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
    alignSelf: 'center',
    height: 40,
    width: 40,
  },
  info: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  url: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  description: {
    flex: 10,
    fontSize: 14,
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
  },
});

export default SiteRow;
