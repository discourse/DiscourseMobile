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

import Icon from 'react-native-vector-icons/FontAwesome'

import DiscourseUtils from '../../DiscourseUtils'

class NotificationRow extends React.Component {
  render() {
    return (
      <TouchableHighlight
        style={[styles.contentView, this._backgroundColor()]}
        underlayColor={'#ffffa6'}
        onPress={()=>this.props.onClick()}>
        <View style={styles.container}>
          <Image style={styles.icon} source={{uri: this.props.site.icon}} />
          {this._iconForNotification(this.props.notification)}
          {this._textForNotification(this.props.notification)}
        </View>
      </TouchableHighlight>
    )
  }

  _iconForNotification(notification) {
    let name = DiscourseUtils.iconNameForNotification(notification)
    return <Icon style={styles.notificationType} name={name} size={14} color="#919191" />
  }

  _textForNotification(notification) {
    switch (notification.notification_type) {
      case 1:
      case 6:
      case 9:
        return (
          <Text style={styles.notificationAuthor}>
            {this.props.notification.data.display_username}
            <Text style={styles.notificationText}>
              {' '}{this.props.notification.data.topic_title}
            </Text>
          </Text>
        )
      case 12:
        return (
          <Text style={styles.notificationText}>
            {' '}{this.props.notification.data.badge_name}
          </Text>
        )
      default:
        console.log('Couldn’t generate text for notification', notification)
        return <Text>Unknown</Text>
    }
  }

  _backgroundColor() {
    let read = this.props.notification.read
    if (read) {
      return {backgroundColor: 'white'}
    } else {
      return {backgroundColor: '#d1f0ff'}
    }
  }
}

const styles = StyleSheet.create({
  contentView: {
    borderBottomColor: '#ddd',
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  notificationAuthor: {
    flex: 1,
    flexDirection: 'column',
    alignSelf: 'center'
  },
  notificationText: {
    color: '#08c',
    flexDirection: 'column',
    alignSelf: 'center'
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    margin: 12
  },
  icon: {
    width: 25,
    height: 25,
    marginRight: 12,
    alignSelf: 'center'
  },
  notificationType: {
    marginRight: 4,
    alignSelf: 'center'
  }
})

export default NotificationRow
