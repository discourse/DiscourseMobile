/* @flow */
'use strict'

class DiscourseUtils {
  static endpointForSiteNotification(site, notification) {
    let endpoint

    switch (notification.notification_type) {
      case 1:
      case 6:
      case 9:
        endpoint = `/t/${notification.slug}/${notification.topic_id}/${notification.post_number}`
        break
      case 12:
        endpoint = `/badges/${notification.data.badge_id}/basic?username=${notification.data.username}`
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
      case 6:
        return 'envelope-o'
      case 9:
        return 'reply'
      case 12:
        return 'certificate'
      default:
        console.log('Couldn’t generate an icon name for notification', notification)
        return 'exclamation-circle'
    }
  }
}

export default DiscourseUtils
