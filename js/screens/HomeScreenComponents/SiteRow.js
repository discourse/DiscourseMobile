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

import colors from '../../colors'
import Notification from './Notification'

class SiteRow extends React.Component {
  render() {
    return (
      <Swipeout
        sensitivity={2}
        backgroundColor={'white'}
        scroll={(scrollEnabled) => this.props.onSwipe(scrollEnabled)}
        right={[{
          text: 'Remove',
          backgroundColor: colors.redDanger,
          onPress: this.props.onDelete
        }]}>
        <TouchableHighlight
          underlayColor={colors.yellowUIFeedback}
          onPress={()=>this.props.onClick()}
          {...this.props.sortHandlers}>
            <View accessibilityTraits="link" style={styles.row}>
              <Image style={styles.icon} source={{uri: this.props.site.icon}} />
              <View style={styles.info}>
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={styles.url}>
                    {this.props.site.url.replace(/^https?:\/\//, '')}
                </Text>
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={2}
                  style={styles.description}>
                    {this.props.site.description}
                </Text>
                {this._renderCounts(this.props.site)}
              </View>
              {this._renderShouldLogin(this.props.site)}
              {this._renderNotifications(this.props.site)}
            </View>
        </TouchableHighlight>
      </Swipeout>
    )
  }

  _renderNotifications(site) {
    if (site.authToken) {
      return (
        <View style={styles.notifications}>
          <Notification color={colors.redDanger} count={site.flagCount}/>
          <Notification color={colors.greenPrivateUnread} count={site.unreadPrivateMessages}/>
          <Notification color={colors.blueUnread} count={site.unreadNotifications}/>
        </View>
      )
    }
  }

  _renderShouldLogin(site) {
    if (!site.authToken) {
      return (
        <View style={styles.notifications}>
          <Text style={styles.connect}>connect</Text>
        </View>
      )
    }
  }

  _renderCounts(site) {
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
          <Text style={styles.countsText}>
            {counts.join('  ')}
          </Text>
        </View>
      )
    }
  }
}

const styles = StyleSheet.create({
  row: {
    borderBottomColor: colors.grayBorder,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    flexDirection: 'row',
    padding: 12
  },
  icon: {
    alignSelf: 'center',
    height: 40,
    width: 40
  },
  info: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: 12
  },
  url: {
    color: colors.grayTitle,
    fontSize: 16,
    fontWeight: 'normal'
  },
  description: {
    color: colors.graySubtitle,
    flex: 10,
    fontSize: 14
  },
  notifications: {
    flexDirection: 'row',
    paddingLeft: 12
  },
  connect: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blueCallToAction,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    marginBottom: 6,
    overflow: 'hidden',
    padding: 6
  },
  counts: {
    marginTop: 6
  },
  countsText: {
    color: colors.blueUnread,
    fontSize: 14
  }
})

export default SiteRow
