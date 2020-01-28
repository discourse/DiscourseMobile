/* @flow */
'use strict';

import React from 'react';
import Immutable from 'immutable';

import {InteractionManager, SafeAreaView, View} from 'react-native';
import {ImmutableVirtualizedList} from 'react-native-immutable-list-view';

import Components from './NotificationsScreenComponents';
import DiscourseUtils from '../DiscourseUtils';
import {ThemeContext} from '../ThemeContext';

class NotificationsScreen extends React.Component {
  static replyTypes = [1, 2, 3, 6, 9, 11, 15, 16, 17];

  constructor(props) {
    super(props);

    this.state = {
      progress: 0,
      renderPlaceholderOnly: true,
      selectedIndex: 0,
    };

    this._onSiteChange = e => {
      if (e.event === 'change') {
        this.refresh();
      }
    };

    this._siteManager = this.props.screenProps.siteManager;

    if (this.props.screenProps.seenNotificationMap) {
      this._seenNotificationMap = this.props.screenProps.seenNotificationMap;
      this.refresh();
    } else {
      this._siteManager
        .getSeenNotificationMap()
        .then(map => {
          this._seenNotificationMap = map;
          this.props.screenProps.setSeenNotificationMap(map);
          this.refresh();
        })
        .done();
    }
  }

  componentDidMount() {
    this._siteManager.subscribe(this._onSiteChange);
    this._mounted = true;

    if (this._refreshed) {
      this.removePlaceholder();
    }
  }

  setTimeout(callback, timeout) {
    if (this._mounted) {
      setTimeout(() => {
        if (this._mounted) {
          callback();
        }
      }, timeout);
    }
  }

  removePlaceholder() {
    InteractionManager.runAfterInteractions(() => {
      this.setTimeout(() => {
        this.setState({renderPlaceholderOnly: false});
      }, 0);
    });
  }

  componentWillUnmount() {
    this._siteManager.unsubscribe(this._onSiteChange);
    this._mounted = false;
  }

  render() {
    const theme = this.context;

    if (this.state.renderPlaceholderOnly) {
      return (
        <View style={{flex: 1, backgroundColor: theme.grayBackground}}>
          <Components.NavigationBar onDidPressRightButton={() => {}} />
          <View style={{height: 50, marginTop: 0, paddingTop: 0}}>
            {this._renderListHeader()}
          </View>
        </View>
      );
    }

    return (
      <SafeAreaView
        style={{flex: 1, backgroundColor: theme.background}}
        forceInset={{top: 'never', bottom: 'always'}}>
        <Components.NavigationBar
          onDidPressRightButton={() => this._onDidPressRightButton()}
          onDidPressLeftButton={() => this._onDidPressLeftButton()}
          progress={this.state.progress}
        />

        {this._renderListHeader()}

        {this.state.dataSource.size > 0
          ? this._renderList()
          : this._renderEmptyNotifications()}
      </SafeAreaView>
    );
  }

  _renderEmptyNotifications() {
    let text;
    switch (this.state.selectedIndex) {
      case 0:
        text = 'No new notifications.';
        break;
      case 1:
        text = 'No replies.';
        break;
      case 2:
        text = 'No notifications.';
        break;
      default:
        text = '';
    }

    return <Components.EmptyNotificationsView text={text} />;
  }

  _renderList() {
    return (
      <ImmutableVirtualizedList
        enableEmptySections={true}
        immutableData={this.state.dataSource}
        renderItem={rowData => this._renderListRow(rowData)}
        keyExtractor={rowData => this._listIndex(rowData)}
        ListEmptyComponent={''}
      />
    );
  }

  _openNotificationForSite(notification, site) {
    site
      .readNotification(notification)
      .catch(e => {
        console.log('failed to mark notification as read ' + e);
      })
      .done();
    let url = DiscourseUtils.endpointForSiteNotification(site, notification);
    this._siteManager.setActiveSite(site);
    this.props.screenProps.openUrl(url);
  }

  _onDidPressLeftButton() {
    this.refresh();
  }

  _onDidPressRightButton() {
    this.props.navigation.goBack();
  }

  _listIndex(row) {
    let rowData = row.toJS();
    return rowData.notification.id.toString();
  }

  _renderListRow(row) {
    let rowData = row.item.toJS();

    return (
      <Components.Row
        site={rowData.site}
        onClick={() =>
          this._openNotificationForSite(rowData.notification, rowData.site)
        }
        notification={rowData.notification}
      />
    );
  }

  refresh() {
    let types =
      this.state.selectedIndex === 1
        ? NotificationsScreen.replyTypes
        : undefined;
    this._fetchNotifications(types, {
      onlyNew: this.state.selectedIndex === 0,
      newMap: this._seenNotificationMap,
      silent: false,
    });
  }

  _renderListHeader() {
    return (
      <Components.Filter
        selectedIndex={this.state.selectedIndex}
        tabs={['New', 'Replies', 'All']}
        onChange={index => {
          this.setState({selectedIndex: index}, () => {
            this.refresh();
          });
        }}
      />
    );
  }

  _fetchNotifications(notificationTypes, options) {
    if (this._fetching) {
      return;
    }
    this._fetching = true;

    if (this._mounted) {
      setTimeout(() => {
        if (this._mounted && this._fetching) {
          this.setState({
            progress: Math.random() * 0.4,
          });
        }
      }, 100);
    }

    this._siteManager
      .notifications(notificationTypes, options)
      .then(notifications => {
        this._notification = notifications;
        this._refreshed = true;

        if (this._mounted) {
          if (this.state.progress !== 0) {
            this.setState({
              progress: 1,
            });

            this.removePlaceholder();

            setTimeout(() => {
              if (this._mounted) {
                this.setState({progress: 0});
              }
            }, 400);
          }

          this.setState({
            dataSource: Immutable.fromJS(notifications),
          });

          this.removePlaceholder();
        }
      })
      .finally(() => {
        this._fetching = false;
      });
  }
}
NotificationsScreen.contextType = ThemeContext;

export default NotificationsScreen;
