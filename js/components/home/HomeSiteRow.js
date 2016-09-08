/* @flow */
'use strict'

import React from 'react'
import {
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View
} from 'react-native'

import Swipeout from 'react-native-swipeout'

class Notification extends React.Component {

  render() {
    if (this.props.count > 0) {
      return (
        <View style={styles.notificationWrapper}>
          <View style={[styles.notificationNumber,
                       {backgroundColor: this.props.color}]}>
            <Text style={styles.notificationNumberText}>{this.props.count}</Text>
          </View>
        </View>
      )
    } else {
      return null
    }
  }
}

class HomeSiteRow extends React.Component {

  renderNotifications(site) {
    if (site.authToken) {
      return (
        <View style={styles.notifications}>
          <Notification color={"#e45735"} count={site.flagCount}/>
          <Notification color={"#01a84c"} count={site.unreadPrivateMessages}/>
          <Notification color={"#0aadff"} count={site.unreadNotifications}/>
        </View>
      )
    }
  }

  renderShouldLogin(site) {
    if (!site.authToken) {
      return (
        <View style={styles.notifications}>
          <Text style={styles.connect}>connect</Text>
        </View>
      )
    }
  }

  renderCounts(site) {
    var counts = []
    if (site.authToken) {
      if (site.totalNew > 0) {
        counts.push('new (' + site.totalNew + ')')
      }
      if (site.totalUnread > 0) {
        counts.push('unread (' + site.totalUnread + ')')
      }
    }

    if (counts.length > 0) {
      return (
        <View style={styles.counts}>
          <Text style={styles.countsText}>{counts.join('  ')}</Text>
        </View>
      )
    }
  }

  render() {
    const site = this.props.site

    return (
      <Swipeout
                backgroundColor={'#FFF'}
                scroll={(scrollEnabled)=>this.props.onSwipe(scrollEnabled)}
                right={[{
                    text: 'Remove',
                    backgroundColor: '#ee512a',
                    onPress: this.props.onDelete
                }]}>
        <TouchableHighlight underlayColor={'#f3f3f3'} onPress={()=>this.props.onClick()} {...this.props.sortHandlers}>
          <View accessibilityTraits="link" style={styles.row}>
            <Image style={styles.icon} source={{uri: site.icon}} />
            <View style={styles.info}>
              <Text
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={styles.url}>
                {site.url.replace(/^https?:\/\//, '')}
              </Text>
              <Text
                  ellipsizeMode="tail"
                  numberOfLines={2}
                  style={styles.description}>
                {site.description}
              </Text>
              {this.renderCounts(site)}
            </View>
            {this.renderShouldLogin(site)}
            {this.renderNotifications(site)}
          </View>
        </TouchableHighlight>
      </Swipeout>
    )
  }
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  icon: {
    width: 40,
    height: 40,
    alignSelf: 'center'
  },
  info: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
    paddingLeft: 12
  },
  url: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'normal'
  },
  description: {
    fontSize: 14,
    color: '#919191',
    flex: 10
  },
  notifications: {
    paddingLeft: 12,
    flexDirection: 'row',
  },
  connect: {
    alignSelf: 'flex-start',
    backgroundColor: '#08c',
    padding: 6,
    marginLeft: 6,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
    overflow: 'hidden'
  },
  notificationWrapper: {
    alignSelf: 'flex-start',
    marginLeft: 6,
    marginBottom: 6,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  notificationNumber: {
    padding: 6,
    borderRadius: 6,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center'
  },
  notificationNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  counts: {
    marginTop: 6
  },
  countsText: {
    fontSize: 14,
    color: '#0aadff'
  }
})

export default HomeSiteRow
