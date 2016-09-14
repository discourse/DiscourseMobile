/* @flow */
'use strict'

import React from 'react'

import {
  AsyncStorage,
  InteractionManager,
  Linking,
  ListView,
  NativeModules,
  Platform,
  StyleSheet,
  View
} from 'react-native'

const ChromeCustomTab = NativeModules.ChromeCustomTab

import _ from 'lodash'
import SafariView from 'react-native-safari-view'

import DiscourseUtils from '../DiscourseUtils'
import NotificationsStore from '../stores/NotificationsStore'
import Site from '../site'
import DiscourseApi from '../DiscourseApi'
import Components from './NotificationsScreenComponents'
import ProgressBar from '../ProgressBar'
import colors from '../colors'

class NotificationsScreen extends React.Component {
  constructor(props) {
    super(props)

    let dataSource = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    this.state =  {
      renderPlaceholderOnly: true,
      progress: 0,
      selectedIndex: 0,
      dataSource: dataSource.cloneWithRows([])
    }
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.setState({renderPlaceholderOnly: false})
    })
  }

  componentWillMount() {
    this._fetchNotifications([1, 6, 9])
  }

  render() {
    if (this.state.renderPlaceholderOnly) {
      return (
        <View style={styles.container}>
          <Components.NavigationBar onDidPressRightButton={() => {}} />
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <Components.NavigationBar
          onDidPressRightButton={() => this._onDidPressRightButton()}
        />
        <ProgressBar progress={this.state.progress} />
        <ListView
          enableEmptySections={true}
          dataSource={this.state.dataSource}
          renderHeader={() => this._renderListHeader()}
          renderRow={(rowData) => this._renderListRow(rowData)}
          style={styles.notificationsList}
        />
      </View>
    )
  }

  _openNotificationForSite(notification, site) {
    NotificationsStore.markAsRead(notification)
    let url = DiscourseUtils.endpointForSiteNotification(site, notification)

    if (Platform.OS === 'ios') {
      SafariView.show({url})
    } else {
      if (this.props.simulator) {
        Linking.openURL(url)
      } else {
        ChromeCustomTab.show(url)
          .then(()=>{})
          .catch((e)=>{alert(e)})
      }
    }
  }

  _onDidPressRightButton() {
    this.props.navigator.pop()
  }

  _renderListRow(rowData) {
    return (
      <Components.Row
        site={rowData.site}
        onClick={() => this._openNotificationForSite(rowData.notification, rowData.site)}
        notification={rowData.notification} />
    )
  }

  _filterNotificationsOnTypes(notifications, types) {
    if (!_.isUndefined(types)) {
      return _.filter(notifications, function(notification) {
        return _.includes(types, notification.notification.notification_type)
      })
    }
    else {
      return notifications
    }
  }

  _renderListHeader() {
    return (
      <Components.Filter
        selectedIndex={this.state.selectedIndex}
        onChange={(index) => {
          let types = index === 0 ? [1, 6, 9] : undefined
          this._fetchNotifications(types)
          this.setState({selectedIndex: index})
        }}
      />
    )
  }

  _fetchNotifications(notificationTypes) {
    NotificationsStore.shouldRefresh().then((shouldRefresh) => {
      if (shouldRefresh) {
        this.setState({progress: Math.random() * 0.4})
        AsyncStorage.getItem('@Discourse.sites').then((jsonSites) => {
          if (jsonSites) {
            let objects = []
            let sites = JSON.parse(jsonSites).map(obj=>new Site(obj))
            let connectedSites = _.filter(sites, function(s) { return !_.isUndefined(s.authToken) })

            let promises = _.map(connectedSites, (site) => {
              return DiscourseApi.getNotifications(site)
            })

            Promise.all(promises).then((responses) => {
              _.each(responses, (response, index) => {
                if ('notifications' in response) {
                  let site = connectedSites[index]
                  _.each(response.notifications, (notification) => {
                    objects.push({notification: notification, site: site})
                  })
                }
              })

              let orderedNotifications = _.orderBy(objects, ['notification.created_at'], ['desc'])
              NotificationsStore.saveNotifications(orderedNotifications)

              let notifications = this._filterNotificationsOnTypes(orderedNotifications, notificationTypes)

              this.setState({
                progress: 1,
                dataSource: this.state.dataSource.cloneWithRows(notifications)
              })

              setTimeout(
                ()=>{ this.setState({progress: 0}) },
                500
              )
            })
          }
        }).done()
      } else {
        NotificationsStore.getAll().then((objects) => {
          let notifications = this._filterNotificationsOnTypes(objects, notificationTypes)
          this.setState({
            dataSource: this.state.dataSource.cloneWithRows(notifications)
          })
        })
      }
    })
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors['grayBackground']
  },
  notificationsList: {
    flex: 1
  }
})

export default NotificationsScreen
