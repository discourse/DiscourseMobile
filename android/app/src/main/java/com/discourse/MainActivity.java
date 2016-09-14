package com.discourse;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.facebook.common.logging.FLog;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.appindexing.Action;
import com.google.android.gms.appindexing.AppIndex;
import com.google.android.gms.common.api.GoogleApiClient;

import java.net.URLEncoder;

import javax.annotation.Nullable;


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
                bundle.putString("url", mActivity.initUrl);
                mActivity.initUrl = null;
            }
            if ("goldfish".equals(Build.HARDWARE) || "ranchu".equals(Build.HARDWARE)) {
                bundle.putBoolean("simulator", true);
            }
            return bundle;

        }
    }

    public String initUrl = null;

    @Override
    protected ReactActivityDelegate createReactActivityDelegate(){
        return new MyDelegate(this, getMainComponentName());
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        initUrl = null;

        Bundle bundle = getIntent().getExtras();
        if (bundle != null) {
            initUrl = bundle.getString("discourse_url");
        }

        super.onCreate(savedInstanceState);
    }


    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
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
