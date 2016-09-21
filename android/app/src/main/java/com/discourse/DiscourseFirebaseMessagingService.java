package com.discourse;

import android.app.Activity;
import android.app.Application;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.TaskStackBuilder;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.Map;


public class DiscourseFirebaseMessagingService extends FirebaseMessagingService {

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {

        if (MainApplication.running) {
            return;
        }

        Map<String,String> data = remoteMessage.getData();
        Context context = getApplicationContext();
        SharedPreferences pref = context.getSharedPreferences("Notifications", Context.MODE_PRIVATE);
        String notifications = pref.getString("current","[]");
        JSONArray array = null;
        try {
            array = new JSONArray(notifications);
        } catch (JSONException e) {
            array = new JSONArray();
        }

        String excerpt = data.get("body");
        array.put(excerpt);

        SharedPreferences.Editor editor = pref.edit();
        editor.putString("current", array.toString());
        editor.commit();

        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for(int i=array.length()-1; (i>=0 && i>array.length()-5); i--) {
            if (!first) {
                sb.append("\n");
            } else {
                first = false;
            }

            try {
                sb.append(array.getString(i));
            } catch (JSONException e) {
                // don't care
                Log.d("Discourse", "Failed to parse json array");
            }
        }

        Intent intent = new Intent(context,DiscourseFirebaseMessagingService.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, 0);

        NotificationManager notificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);


        TaskStackBuilder stackBuilder = TaskStackBuilder.create(context);
        stackBuilder.addNextIntent(intent);
        stackBuilder.getPendingIntent(0, PendingIntent.FLAG_UPDATE_CURRENT);

        Intent notificationIntent = new Intent(context, MainActivity.class);

        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pendingOpenIntent = PendingIntent.getActivity(context, 0,
                notificationIntent, 0);


        Notification notification = new Notification.Builder(context)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(String.valueOf(array.length()) + " new alert" + (array.length()==1 ? "" : "s"))
                .setContentText(excerpt)
                .setAutoCancel(true)
                .setStyle(new Notification.BigTextStyle()
                        .bigText(sb.toString()))
                .setContentIntent(pendingIntent)
                .setNumber(array.length())
                .setContentIntent(pendingOpenIntent)
                .build();


        notification.flags |= Notification.FLAG_AUTO_CANCEL;

        // 666 is the number of the beast
        notificationManager.notify(666, notification);

    }
}
