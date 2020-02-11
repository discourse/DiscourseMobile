package com.discourse;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.facebook.common.logging.FLog;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;

import java.net.URLEncoder;

import javax.annotation.Nullable;
import android.util.Log;

public class MainActivity extends ReactActivity {

    private class MyDelegate extends ReactActivityDelegate {
        private final MainActivity mActivity;

        public MyDelegate(MainActivity activity, @Nullable String mainComponent) {
            super(activity, mainComponent);
            mActivity = activity;
        }

        @Override
        protected @Nullable Bundle getLaunchOptions(){
            Bundle bundle = new Bundle();
            if (mActivity.initUrl != null) {
                Log.d("Discourse", "initUrl: " + mActivity.initUrl);
                bundle.putString("url", mActivity.initUrl);
                mActivity.initUrl = null;
            }
            if ("goldfish".equals(Build.HARDWARE) || "ranchu".equals(Build.HARDWARE)) {
                bundle.putBoolean("simulator", true);
            }
            return bundle;

        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        MainApplication.running = false;
    }

    public String initUrl = null;

    @Override
    protected void onResume(){
        super.onResume();
        Log.d("Discourse", "onResume");

        MainApplication.running = true;

        // clear all notifications
        Context context = getApplicationContext();
        SharedPreferences pref = context.getSharedPreferences("Notifications", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = pref.edit();
        editor.putString("current", "[]");
        editor.commit();

        NotificationManager notificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.cancel(666);

    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate(){
        return new MyDelegate(this, getMainComponentName());
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    /**
    * Returns the name of the main component registered from JavaScript. This is used to schedule
    * rendering of the component.
    */
    @Override
    protected String getMainComponentName() {
        return "Discourse";
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
      super.onConfigurationChanged(newConfig);
      Intent intent = new Intent("onConfigurationChanged");
      intent.putExtra("newConfig", newConfig);
      this.sendBroadcast(intent);
    }

}
