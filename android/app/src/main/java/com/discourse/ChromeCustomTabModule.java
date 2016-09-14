package com.discourse;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.support.customtabs.CustomTabsIntent;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


public class ChromeCustomTabModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public ChromeCustomTabModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
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
            promise.resolve(false);
            return;
        }

        if (serviceIntent == null || activity.getPackageManager().resolveService(serviceIntent, 0) == null) {
            promise.reject(new JSApplicationIllegalArgumentException("chrome not installed"));
        } else {
            CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
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
