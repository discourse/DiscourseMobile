/* @flow */
'use strict'

class DiscourseUtils {
  static endpointForSiteNotification(site, notification) {
    let endpoint

    let data = notification.data

    switch (notification.notification_type) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 13:
      case 14:
      case 15:
      case 17:
        endpoint = `/t/${notification.slug}/${notification.topic_id}/${notification.post_number}`
        break
      case 12:
        endpoint = `/badges/${data.badge_id}/basic?username=${data.username}`
        break
      case 16:
        endpoint = `/users/${data.username}/messages/group/${data.group_name}`
        break
      default:
        console.log('Couldn’t generate an endpoint for notification', notification)
        endpoint = ''
    }

    return `${site.url}${endpoint}`
  }

  static iconNameForNotification(notification) {
    switch (notification.notification_type) {
      case 1:
        return 'at'
      case 2:
          return 'reply'
      case 3:
          return 'quote-right'
      case 4:
          return 'pencil'
      case 5:
          return 'heart'
      case 6:
        return 'envelope-o'
      case 7:
        return 'envelope-o'
      case 8:
        return 'user'
      case 9:
        return 'reply'
      case 10:
        return 'sign-out'
      case 11:
        return 'link'
      case 12:
        return 'certificate'
      case 13:
        return 'hand-o-right'
      case 14:
        return 'check-square'
      case 15:
        return 'at'
      case 16:
        return 'group'
      case 17:
        return 'dot-circle-o'
      default:
        console.log('Couldn’t generate an icon name for notification', notification)
        return 'exclamation-circle'
    }
  }
}

export default DiscourseUtils
