/* @flow */
'use strict'

import React from 'react'

import {
  InteractionManager,
  ListView,
  StyleSheet,
  View
} from 'react-native'

import DiscourseUtils from '../DiscourseUtils'
import Components from './NotificationsScreenComponents'
import colors from '../colors'

class NotificationsScreen extends React.Component {

  static replyTypes = [1, 2, 3, 6, 9, 11, 15, 16, 17]

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

    this._onSiteChange = ()=>{
      this.refresh()
    }

    this.props.siteManager.subscribe(this._onSiteChange)

    InteractionManager.runAfterInteractions(() => {
      this.setState({renderPlaceholderOnly: false})
    })
  }

  componentWillUnmount() {
    this.props.siteManager.unsubscribe(this._onSiteChange)
  }

  componentWillMount() {
    this.refresh()
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
          progress={this.state.progress}
        />
        {this._renderList()}
      </View>
    )
  }

  _renderList() {
    if (this.state.dataSource.getRowCount() === 0) {
      return <Components.EmptyNotificationsView />
    }
    else {
      return (
        <ListView
          enableEmptySections={true}
          dataSource={this.state.dataSource}
          renderHeader={() => this._renderListHeader()}
          renderRow={(rowData) => this._renderListRow(rowData)}
          style={styles.notificationsList}
        />
      )
    }
  }

  _openNotificationForSite(notification, site) {
    site.readNotification(notification).catch((e)=>{
      console.log("failed to mark notification as read " + e)
    }).done()
    let url = DiscourseUtils.endpointForSiteNotification(site, notification)
    this.props.openUrl(url)
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

  refresh(){
    let types = this.state.selectedIndex === 1 ? NotificationsScreen.replyTypes : undefined
    this._fetchNotifications(types, {onlyNew: this.state.selectedIndex === 0})
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
    this.setState({progress: Math.random() * 0.4})

    this.props.siteManager.notifications(notificationTypes, options)
      .then(notifications => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(notifications),
          progress: 1
        })
      })
      .finally(() => {
        setTimeout(() => {
          this.setState({progress: 0})
        }, 1000)
      })
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayBackground
  },
  notificationsList: {
    flex: 1
  }
})

export default NotificationsScreen
