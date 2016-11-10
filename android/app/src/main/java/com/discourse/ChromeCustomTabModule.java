package com.discourse;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.support.customtabs.CustomTabsClient;
import android.support.customtabs.CustomTabsIntent;
import android.support.customtabs.CustomTabsServiceConnection;
import android.support.customtabs.CustomTabsSession;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


public class ChromeCustomTabModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private CustomTabsClient mCustomTabsClient;
    private CustomTabsSession mCustomTabsSession;

    CustomTabsServiceConnection connection = new CustomTabsServiceConnection() {
        @Override
        public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
            mCustomTabsClient = client;
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {

        }
    };

    public ChromeCustomTabModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        CustomTabsClient.bindCustomTabsService(this.reactContext, "com.android.chrome", connection);
    }

    public CustomTabsSession getSession() {
        if (mCustomTabsClient == null) {
            mCustomTabsSession = null;
        } else if (mCustomTabsSession == null) {
            mCustomTabsSession = mCustomTabsClient.newSession(null);
        }
        return mCustomTabsSession;
    }

    @Override
    public String getName() {
        return "ChromeCustomTab";
    }

    @ReactMethod
    public void show(String location, Promise promise) {
        final Intent serviceIntent = new Intent("android.support.customtabs.action.CustomTabsService")
                .setPackage("com.android.chrome");

        final Activity activity = getCurrentActivity();

        if (activity == null) {
            promise.reject(new JSApplicationIllegalArgumentException("no current activity"));
            return;
        }

        if (serviceIntent == null || activity.getPackageManager().resolveService(serviceIntent, 0) == null) {
            promise.reject(new JSApplicationIllegalArgumentException("chrome stable not installed"));
        } else {
            CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder(getSession());
            CustomTabsIntent customTabsIntent = builder.build();
            customTabsIntent.intent.setPackage("com.android.chrome");
            Uri url = Uri.parse(location);
            if (url != null) {
                if (activity != null) {
                    customTabsIntent.launchUrl(activity, url);
                    promise.resolve(true);
                } else {
                    promise.resolve(false);
                }
            } else {
                promise.reject(new JSApplicationIllegalArgumentException("invalid url: " + location));
            }
        }
    }
}
