package com.discourse;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.support.customtabs.CustomTabsIntent;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.firebase.iid.FirebaseInstanceId;

/**
 * Created by sam on 9/13/2016.
 */

public class AndroidTokenModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public AndroidTokenModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "AndroidToken";
    }

    @ReactMethod
    public void GetInstanceId(Callback callback) {
        String token = FirebaseInstanceId.getInstance().getToken();
        callback.invoke(token);
    }
}
