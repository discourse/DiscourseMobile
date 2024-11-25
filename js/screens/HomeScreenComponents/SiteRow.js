/* @flow */
'use strict';

import React, {useContext, useRef} from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import {SwipeRow} from 'react-native-swipe-list-view';
import Notification from './Notification';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {ThemeContext} from '../../ThemeContext';
import i18n from 'i18n-js';
import TopicList from './TopicList';

const SWIPE_BUTTON_WIDTH = 70;

export default function SiteRow(props) {
  const theme = useContext(ThemeContext);

  const largeLayout = Dimensions.get('window').width > 600;
  const iconUrl = props.site.icon;
  const milliseconds = (h, m, s) => (h * 60 * 60 + m * 60 + s) * 1000;
  // only remember last visited for 1 day
  const lastVisitedThreshold = milliseconds(24, 0, 0);
  let swipeRowRef = useRef(0);

  let iconPath =
    iconUrl && !iconUrl.endsWith('.webp') && !iconUrl.endsWith('.svg')
      ? {uri: iconUrl}
      : require('../../../img/nav-icon-gray.png');

  const _renderNotifications = () => {
    if (!props.site.authToken) {
      return null;
    }

    return (
      <View style={styles.notifications}>
        <Notification
          color={theme.redDanger}
          count={props.site.flagCount}
          icon={'flag'}
        />
        <Notification
          color={theme.greenPrivateUnread}
          count={props.site.unreadPrivateMessages}
          icon={'envelope'}
        />
        <Notification
          color={theme.purpleChat}
          count={props.site.chatNotifications}
          icon={'comment'}
        />
        <Notification
          color={theme.blueUnread}
          count={props.site.unreadNotifications}
          icon={'bell'}
        />
      </View>
    );
  };

  const _renderConnect = () => {
    return (
      <TouchableHighlight
        style={styles.notifications}
        underlayColor={theme.background}
        onPress={() => props.onClickConnect()}>
        <View
          style={{
            ...styles.connect,
            backgroundColor: theme.blueCallToAction,
            color: theme.buttonTextColor,
          }}>
          <FontAwesome5
            name={'user'}
            size={15}
            color={theme.buttonTextColor}
            style={{padding: 3}}
            solid
          />
          {largeLayout && (
            <Text
              style={{
                color: theme.buttonTextColor,
                paddingHorizontal: 3,
                fontSize: 16,
              }}>
              {i18n.t('connect')}
            </Text>
          )}
        </View>
      </TouchableHighlight>
    );
  };

  const _renderCountItem = (item, index) => {
    return (
      <TouchableHighlight
        key={index}
        style={styles.countItem}
        underlayColor={theme.yellowUIFeedback}
        onPress={() => _click(item.link)}>
        <Text style={{color: theme.blueUnread, fontSize: 15}}>{item.text}</Text>
      </TouchableHighlight>
    );
  };

  const _renderShortcuts = () => {
    const shortcuts = {};

    if (props.site.authToken) {
      if (props.site.totalNew > 0) {
        shortcuts.new = {
          link: '/new',
          text: i18n.t('new_with_count', {count: props.site.totalNew}),
        };
      }
      if (props.site.totalUnread > 0) {
        shortcuts.unread = {
          link: '/unread',
          text: i18n.t('unread_with_count', {count: props.site.totalUnread}),
        };
      }
    }

    if (props.site.groupInboxes && props.site.groupInboxes.length > 0) {
      props.site.groupInboxes.sort(function (a, b) {
        if (a.group_name && b.group_name) {
          return a.group_name.localeCompare(b.group_name);
        } else {
          return true;
        }
      });

      props.site.groupInboxes.forEach(group => {
        // TODO(pmusaraj): remove inbox_count after June 2024
        // at the same time as old API fallbacks in site#refresh()
        const count = group.count || group.inbox_count;

        if (count !== undefined) {
          shortcuts[group.group_name] = {
            link: `/u/${props.site.username}/messages/group/${group.group_name}`,
            text: `${group.group_name} (${count})`,
          };
        }
      });
    }

    const buttons = Object.values(shortcuts);

    if (buttons.length > 0) {
      return (
        <View style={styles.shortcuts}>{buttons.map(_renderCountItem)}</View>
      );
    }
  };

  const _click = url => {
    swipeRowRef.current && swipeRowRef.current.closeRow();
    props.onClick(url);
  };

  const chatEnabled = props.site.hasChatEnabled;
  const now = new Date().getTime();

  const hasLastVisitedAction =
    props.site.lastVisitedPath &&
    props.site.lastVisitedPathAt > now - lastVisitedThreshold;

  let leftOpenValue = SWIPE_BUTTON_WIDTH;
  if (chatEnabled) {
    leftOpenValue += SWIPE_BUTTON_WIDTH;
  }
  if (hasLastVisitedAction) {
    leftOpenValue += SWIPE_BUTTON_WIDTH;
  }

  // only show the primary "Connect" button for 3 days
  // after that time use a hidden button in swipe right area
  const createdAtThreshold = milliseconds(24 * 3, 0, 0);

  const alreadyAuthed = props.site.authToken;
  const hasPrimaryConnectButton =
    !alreadyAuthed &&
    props.site.createdAt &&
    props.site.createdAt > now - createdAtThreshold;

  const rightOpenValue = !hasPrimaryConnectButton
    ? -SWIPE_BUTTON_WIDTH * 2
    : -SWIPE_BUTTON_WIDTH;

  const showTopicList =
    largeLayout && !props.site.loginRequired && props.showTopicList;

  return (
    <SwipeRow
      ref={swipeRowRef}
      rightOpenValue={showTopicList ? 0 : rightOpenValue}
      leftOpenValue={showTopicList ? 0 : leftOpenValue}
      recalculateHiddenLayout={true}
      swipeToOpenPercent={20}
      swipeToClosePercent={10}>
      <View style={{...styles.hiddenRow}}>
        {!showTopicList && (
          <View style={{...styles.leftButtons}}>
            <TouchableHighlight
              style={{
                ...styles.hiddenButton,
                backgroundColor: theme.blueCallToAction,
              }}
              underlayColor={theme.blueCallToAction}
              onPress={() => _click('/hot')}
              {...props.sortHandlers}>
              <FontAwesome5
                name={'fire'}
                size={24}
                color={theme.buttonTextColor}
              />
            </TouchableHighlight>
            {chatEnabled && (
              <TouchableHighlight
                style={{
                  ...styles.hiddenButton,
                  backgroundColor: theme.purpleChat,
                }}
                underlayColor={theme.purpleChat}
                onPress={() => _click('/chat')}
                {...props.sortHandlers}>
                <FontAwesome5
                  name={'comment'}
                  size={24}
                  color={theme.buttonTextColor}
                  solid
                />
              </TouchableHighlight>
            )}
            {hasLastVisitedAction && (
              <TouchableHighlight
                style={{
                  ...styles.hiddenButton,
                  backgroundColor: theme.grayUI,
                }}
                underlayColor={theme.grayUI}
                onPress={() => _click(props.site.lastVisitedPath)}
                {...props.sortHandlers}>
                <FontAwesome5
                  name={'history'}
                  size={24}
                  color={theme.buttonTextColor}
                />
              </TouchableHighlight>
            )}
          </View>
        )}
        {!showTopicList && (
          <View style={{...styles.rightButtons}}>
            {!hasPrimaryConnectButton && (
              <TouchableHighlight
                style={{
                  ...styles.hiddenButton,
                  backgroundColor: theme.blueCallToAction,
                }}
                underlayColor={theme.blueCallToAction}
                onPress={() => props.onClickConnect()}
                {...props.sortHandlers}>
                <FontAwesome5
                  name={'user'}
                  size={24}
                  color={theme.buttonTextColor}
                  solid
                />
              </TouchableHighlight>
            )}
            <TouchableHighlight
              testID="site-row-delete"
              style={{
                ...styles.hiddenButton,
                backgroundColor: theme.redDanger,
              }}
              underlayColor={theme.redDanger}
              onPress={props.onDelete}
              {...props.sortHandlers}>
              <FontAwesome5
                name={'trash-alt'}
                size={24}
                color={theme.buttonTextColor}
              />
            </TouchableHighlight>
          </View>
        )}
      </View>
      <View
        style={{
          ...styles.siteRowWrapper,
          backgroundColor: theme.background,
          borderBottomColor: theme.grayBorder,
        }}>
        <TouchableHighlight
          underlayColor={'theme.background'}
          activeOpacity={0.6}
          onPress={() => _click()}
          onLongPress={() => !showTopicList && props.onLongPress()}
          onPressOut={() => !showTopicList && props.onPressOut()}
          style={{...styles.touchableWrapper}}
          {...props.sortHandlers}>
          <View accessibilityTraits="link" style={{...styles.row}}>
            <Image style={styles.icon} source={iconPath} resizeMode="contain" />
            <View style={styles.info}>
              <View style={styles.titleAndBadges}>
                <View style={styles.titleParent}>
                  <Text
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={{...styles.title, color: theme.grayTitle}}>
                    {props.site.title}
                  </Text>
                  <Text
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={{...styles.url, color: theme.graySubtitle}}>
                    {props.site.url.replace(/^https?:\/\//, '')}
                  </Text>
                </View>
                {_renderNotifications()}
                {hasPrimaryConnectButton && !showTopicList && _renderConnect()}
              </View>
              {_renderShortcuts()}
            </View>
          </View>
        </TouchableHighlight>
        {showTopicList && (
          <View
            testID="topic-list"
            style={{...styles.hotBox, borderColor: theme.grayBorder}}>
            <TopicList site={props.site} onClickTopic={url => _click(url)} />
          </View>
        )}
      </View>
    </SwipeRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  siteRowWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
  },
  touchableWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  hiddenRow: {
    height: '100%',
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  hiddenButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: SWIPE_BUTTON_WIDTH,
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  icon: {
    alignSelf: 'flex-start',
    height: 40,
    width: 40,
    marginTop: 2,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  info: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  titleAndBadges: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexBasis: 'auto',
    flexGrow: 0,
  },
  titleParent: {
    // needed for ellipsizeMode to work on title child element
    flex: 1,
    alignContent: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: 'normal',
    paddingLeft: 6,
    flexBasis: 'auto',
    flexGrow: 0,
  },
  url: {
    fontSize: 14,
    fontWeight: 'normal',
    paddingLeft: 6,
    paddingTop: 6,
    flexBasis: 'auto',
    flexGrow: 0,
  },
  description: {
    flex: 10,
    fontSize: 14,
    paddingLeft: 6,
    paddingTop: 6,
  },
  notifications: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    paddingLeft: 12,
    maxWidth: '50%',
  },
  connect: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexWrap: 'nowrap',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    marginBottom: 6,
    overflow: 'hidden',
    padding: 6,
    borderRadius: 6,
  },
  shortcuts: {
    marginTop: 6,
    flexDirection: 'row',
    display: 'flex',
    flexWrap: 'wrap',
  },
  countItem: {
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  hotBox: {
    width: '68%',
    height: '100%',
    borderLeftWidth: 1,
    marginBottom: 20,
    marginLeft: 20,
  },
});
