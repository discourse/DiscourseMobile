# Discourse Mobile

Native iOS and Android app for Discourse

## Getting Started

Install Yarn and Watchman

```
npm install -g yarn
brew install watchman
```

Install all the project dependencies:

```
yarn
```

On macOS, make sure you install CocoaPods and its packages:

```
bundle
pod install --project-directory=ios
```

Once installed you can get started with:

```
npx react-native start

// and in a second terminal, either:
npx react-native run-ios
// or
npx react-native run-android
```

See more at: https://facebook.github.io/react-native/docs/getting-started.html

Note, on Android your localhost may not be accessible from the simulator, read the error message carefully and consider running:

```
adb reverse tcp:8081 tcp:8081
```

## iPhone Duo testing

Build with Xcode 27.1 or later and select **iPhone Duo** in Simulator. See
[Apple’s iPhone Duo preparation guide](https://developer.apple.com/iphone-duo/prepare/).

- With the app running, fold and unfold it on Home, Discover, and an open
  community. Check that the active screen, scroll position, and typed text survive.
- Rotate it while closed, fully open, and partially folded. Check the tab bar,
  dialogs, and WebView controls for clipping near the status bar, camera, or fold.
- Check custom URLs, universal links, and notification taps with the app both
  running and terminated. Repeat basic launch and navigation on iPhone and iPad.
