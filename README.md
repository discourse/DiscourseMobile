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
