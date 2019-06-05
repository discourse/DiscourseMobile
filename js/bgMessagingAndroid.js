// @flow
import firebase from 'react-native-firebase';
import type { RemoteMessage } from 'react-native-firebase';

export default async (message: RemoteMessage) => {
	const notification = new firebase.notifications.Notification()
	  .setNotificationId(message.messageId)
	  .setTitle(message.data.title)
	  .setBody(message.data.body)
	  .setData({
	    url: message.data.discourse_url,
	    topic_title: message.data.topic_title,
	  });
	
	notification
	  .android.setChannelId('discourse')
	  .android.setSmallIcon('ic_stat_name');

	notification.android.setAutoCancel( true ); 

    firebase.notifications().displayNotification(notification);
    return Promise.resolve();
}