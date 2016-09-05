package com.discourse;

import android.content.Intent;
import android.content.res.Configuration;
import com.facebook.react.ReactActivity;
import com.github.yamill.orientation.OrientationPackage;
import com.reactlibrary.RNKeyPairPackage;
import com.RNFetchBlob.RNFetchBlobPackage;

public class MainActivity extends ReactActivity {

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
