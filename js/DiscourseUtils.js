/* @flow */
'use strict';

class DiscourseUtils {
  static endpointForSiteNotification(site, notification) {
    let endpoint;

    let data = notification.data;

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
      case 18:
      case 20:
      case 24:
        endpoint = `/t/${notification.slug}/${notification.topic_id}/${notification.post_number}`;
        break;
      case 12:
        endpoint = `/badges/${data.badge_id}/basic?username=${data.username}`;
        break;
      case 16:
        endpoint = `/users/${data.username}/messages/group/${data.group_name}`;
        break;
      case 19:
        endpoint = `/u/${site.username}/notifications/likes-received?acting_username=${data.username}`;
        break;
      case 21:
        if (notification.fancy_title !== undefined) {
          endpoint = `/t/${notification.slug}/${notification.topic_id}/${notification.post_number}`;
        } else {
          endpoint = `/u/${site.username}/activity/approval-given`;
        }
        break;
      case 22:
        endpoint = `/g/${data.group_name}`;
        break;
      default:
        console.log(
          'Couldn’t generate an endpoint for notification',
          notification,
        );
        endpoint = '';
    }
    console.log(endpoint);
    return `${site.url}${endpoint}`;
  }

  static iconNameForNotification(notification) {
    switch (notification.notification_type) {
      case 1:
        return 'at';
      case 2:
        return 'reply';
      case 3:
        return 'quote-right';
      case 4:
        return 'pencil-alt';
      case 5:
        return 'heart';
      case 6:
        return 'envelope';
      case 7:
        return 'envelope';
      case 8:
        return 'user';
      case 9:
        return 'reply';
      case 10:
        return 'sign-out';
      case 11:
        return 'link';
      case 12:
        return 'certificate';
      case 13:
        return 'hand-point-right';
      case 14:
        return 'check-square';
      case 15:
        return 'at';
      case 16:
        return 'users';
      case 17:
        return 'dot-circle';
      case 18:
        return 'clock';
      case 19:
        return 'heart';
      case 20:
      case 21:
        return 'check';
      case 22:
        return 'user-plus';
      case 24:
        return 'bookmark';
      default:
        console.log(
          'Couldn’t generate an icon name for notification',
          notification,
        );
        return 'exclamation-circle';
    }
  }
}

export default DiscourseUtils;
