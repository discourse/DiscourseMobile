/* @flow */
'use strict';

import React from 'react';
import Immutable from 'immutable';
import {InteractionManager, SafeAreaView, View} from 'react-native';
import {ImmutableVirtualizedList} from 'react-native-immutable-list-view';
import Components from './NotificationsScreenComponents';
import Common from './CommonComponents';
import DiscourseUtils from '../DiscourseUtils';
import {ThemeContext} from '../ThemeContext';
import i18n from 'i18n-js';
import {BottomTabBarHeightContext} from '@react-navigation/bottom-tabs';

class NotificationsScreen extends React.Component {
  static replyTypes = [1, 2, 3, 6, 9, 11, 15, 16, 17];

  constructor(props) {
    super(props);

    this.state = {
      progress: 0,
      renderPlaceholderOnly: true,
      selectedIndex: 0,
      connectedSites: 0,
    };

    this._siteManager = this.props.screenProps.siteManager;

    if (this.props.screenProps.seenNotificationMap) {
      this._seenNotificationMap = this.props.screenProps.seenNotificationMap;
      this.refresh();
    } else {
      this._siteManager.getSeenNotificationMap().then(map => {
        this._seenNotificationMap = map;
        this.props.screenProps.setSeenNotificationMap(map);
        this.refresh();
      });
    }
  }

  componentDidMount() {
    this.setState({connectedSites: this._siteManager.connectedSitesCount()});
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
    this._mounted = false;
  }

  render() {
    const theme = this.context;

    if (this.state.renderPlaceholderOnly) {
      return (
        <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
          <Components.NavigationBar onDidPressRightButton={() => {}} />
          <View style={{height: 50, marginTop: 0, paddingTop: 0}}>
            {this._renderListHeader()}
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
        <Components.NavigationBar progress={this.state.progress} />

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
        text = i18n.t('no_new_notifications');
        break;
      case 1:
        text = i18n.t('no_replies');
        break;
      case 2:
        text = i18n.t('no_notifications');
        break;
      default:
        text = '';
    }

    if (this.state.connectedSites === 0) {
      text = i18n.t('no_connected_sites');
    }

    return <Components.EmptyNotificationsView text={text} />;
  }

  _renderList() {
    return (
      <BottomTabBarHeightContext.Consumer>
        {tabBarHeight => (
          <ImmutableVirtualizedList
            contentContainerStyle={{paddingBottom: tabBarHeight}}
            enableEmptySections={true}
            immutableData={this.state.dataSource}
            renderItem={rowData => this._renderListRow(rowData)}
            keyExtractor={rowData => this._listIndex(rowData)}
            ListEmptyComponent={''}
          />
        )}
      </BottomTabBarHeightContext.Consumer>
    );
  }

  _openNotificationForSite(notification, site) {
    site.readNotification(notification).catch(e => {
      console.log('failed to mark notification as read ' + e);
    });

    let url = DiscourseUtils.endpointForSiteNotification(site, notification);
    this._siteManager.setActiveSite(site);
    this.props.screenProps.openUrl(url);
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
      <Common.Filter
        selectedIndex={this.state.selectedIndex}
        tabs={[i18n.t('new'), i18n.t('replies'), i18n.t('all')]}
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
