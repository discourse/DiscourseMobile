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
            {this._iconForNotification(this.props.notification)}
            {this._textForNotification(this.props.notification)}
            <Image style={styles.siteIcon} source={{uri: this.props.site.icon}} />
          </View>
      </TouchableHighlight>
    )
  }

  _iconForNotification(notification) {
    let name = DiscourseUtils.iconNameForNotification(notification)
    return <Icon style={styles.notificationIcon} name={name} size={14} color="#919191" />
  }

  _textForNotification(notification) {
    let innerText

    switch (notification.notification_type) {
      case 1:
      case 6:
      case 9:
        innerText = (
          <Text>
            {this.props.notification.data.display_username}
            <Text style={styles.notificationText}>
              {' '}{this.props.notification.data.topic_title}
            </Text>
          </Text>
        )
        break
      case 12:
        innerText = (
          <Text style={styles.notificationText}>
            {' '}{this.props.notification.data.badge_name}
          </Text>
        )
        break
      default:
        console.log('Couldn’t generate text for notification', notification)
        innerText = <Text>Unknown</Text>
    }

    return <Text style={styles.textContainer}>{innerText}</Text>
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
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    alignSelf: 'center',
    fontSize: 14
  },
  notificationText: {
    color: '#08c',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    margin: 12
  },
  siteIcon: {
    width: 25,
    height: 25,
    alignSelf: 'center',
    marginLeft: 12
  },
  notificationIcon: {
    alignSelf: 'center',
    marginRight: 12
  }
})

export default NotificationRow
