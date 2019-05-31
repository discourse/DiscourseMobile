Discourse Mobile
---

Native iOS and Android app for Discourse

### Getting Started

We use yarn to manage dependencies, be sure to have it installed:


```
npm install -g yarn
```

Next make sure you have react-native cli installed:

```
npm install -g react-native-cli
```

Ensure you install all the latest and greatest packages:

```
cd DiscourseMobile
% yarn
% yarn build-rn-webview
```

(Note: the `yarn build-rn-webview` step is temporary. it will be removed on react-native-webview merges our PRs.)

Once installed you can get started with:


```
// https://facebook.github.io/react-native/docs/getting-started.html
react-native run-ios
react-native run-android
```

We are temporarily using a fork of react-native-webview. Please run 
```

```

Note, on Android your localhost may not be accessible from the simulator, read the error message carefully and consider running:

```
adb reverse tcp:8081 tcp:8081
```

