/* @flow */
'use strict'

import React from 'react'

import {
  InteractionManager,
  ListView,
  StyleSheet,
  Text,
  View
} from 'react-native'

import DiscourseUtils from '../DiscourseUtils'
import Components from './NotificationsScreenComponents'
import colors from '../colors'

class NotificationsScreen extends React.Component {

  static replyTypes = [1, 2, 3, 6, 9, 11, 15, 16, 17]

  constructor(props) {
    super(props)

    this.state =  {
      progress: 0,
      renderPlaceholderOnly: true,
      selectedIndex: 0,
      dataSource: new ListView.DataSource({
        rowHasChanged: (r1, r2) => r1 !== r2
      })
    }

    this._onSiteChange = (e)=>{
      if (e.event === "change") {
        this.refresh()
      }
    }


    if (this.props.seenNotificationMap) {
      this._seenNotificationMap = this.props.seenNotificationMap
      this.refresh()
    } else {
      this.props.siteManager.getSeenNotificationMap()
        .then((map)=>{
          this._seenNotificationMap = map
          this.props.setSeenNotificationMap(map)
          this.refresh()
        }).done()
    }

  }

  componentDidMount() {

    if (this._notifications) {
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(this._notifications),
      })
    }

    this.props.siteManager.subscribe(this._onSiteChange)
    this._mounted = true

    if (this._refreshed) {
      removePlaceholder()
    }
  }

  setTimeout(callback, timeout) {
    if (this._mounted) {
      setTimeout(()=>{
        if (this._mounted) {
          callback()
        }
      },timeout)
    }
  }

  removePlaceholder() {
    InteractionManager.runAfterInteractions(()=>{
      this.setTimeout(()=>{
        this.setState({renderPlaceholderOnly: false})
      },0)
    })
  }

  componentWillUnmount() {
    this.props.siteManager.unsubscribe(this._onSiteChange)
    this._mounted = false
  }

  render() {
    if (this.state.renderPlaceholderOnly) {
      return (
        <View style={styles.container}>
          <Components.NavigationBar onDidPressRightButton={() => {}} />
          <View style={{height: 50, marginTop: 0, paddingTop: 0}}>
            {this._renderListHeader()}
          </View>
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <Components.NavigationBar
          onDidPressRightButton={() => this._onDidPressRightButton()}
          onDidPressLeftButton={() => this._onDidPressLeftButton()}
          progress={this.state.progress}
        />
        {this._renderList()}
        {this._renderEmptyNotifications()}
      </View>
    )
  }

  _renderEmptyNotifications() {
    if (this.state.dataSource.getRowCount() === 0) {
      let text
      switch (this.state.selectedIndex) {
        case 0:
          text = "No new notifications."
          break
        case 1:
          text = "No replies."
          break
        case 2:
          text = "No notifications."
          break
        default:
          text = ""
      }

      return <Components.EmptyNotificationsView text={text} />
    }

    return null
  }

  _renderList() {
    return (
      <ListView
        enableEmptySections={true}
        dataSource={this.state.dataSource}
        renderHeader={() => this._renderListHeader()}
        renderRow={(rowData) => this._renderListRow(rowData)}
      />
    )
  }

  _openNotificationForSite(notification, site) {
    // lets try without collapsing, it gets a bit confusing
    // setTimeout(()=>{
    //   InteractionManager.runAfterInteractions(()=>{
    //     // simulate behavior on site
    //     // when visiting a notification the notification
    //     // list is collapsed
    //     this.props.resetToTop()
    //   })
    // }, 400)
    site.readNotification(notification).catch((e)=>{
      console.log("failed to mark notification as read " + e)
    }).done()
    let url = DiscourseUtils.endpointForSiteNotification(site, notification)
    this.props.openUrl(url)
  }

  _onDidPressLeftButton() {
    this.refresh()
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

  refresh() {
    let types = this.state.selectedIndex === 1 ? NotificationsScreen.replyTypes : undefined
    this._fetchNotifications(types, {
      onlyNew: this.state.selectedIndex === 0,
      newMap: this._seenNotificationMap,
      silent: false
    })
  }

  _renderListHeader() {
    return (
      <Components.Filter
        selectedIndex={this.state.selectedIndex}
        tabs={['New', 'Replies', 'All']}
        onChange={(index) => {
          this.setState({selectedIndex: index}, ()=>{this.refresh()})
        }}
      />
    )
  }

  _fetchNotifications(notificationTypes, options) {

    if (this._fetching) { return }
    this._fetching = true

    let progressTimeout
    if (this._mounted) {
      progressTimeout = setTimeout(()=>{
        if (this._mounted && this._fetching) {
          this.setState({
            progress: Math.random() * 0.4
          })
        }
      }, 100)
    }

    this.props.siteManager.notifications(notificationTypes, options)
        .then(notifications => {
                this._notification = notifications
                this._refreshed = true

                if (this._mounted) {
                  if (this.state.progress !== 0) {

                    this.setState({
                      progress: 1
                    })

                    this.removePlaceholder()

                    setTimeout(()=>{
                      if (this._mounted) {
                        this.setState({progress: 0})
                      }
                    },400)
                  }

                  this.setState({
                    dataSource: this.state.dataSource.cloneWithRows(notifications)
                  })

                  this.removePlaceholder()
                }
        })
        .finally(()=>{this._fetching = false})

  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayBackground
  }
})

export default NotificationsScreen
