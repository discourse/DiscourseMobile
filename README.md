## Discourse Mobile

Native iOS and Android app for Discourse

### Getting Started

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
sudo gem install cocoapods
cd ios/
pod install
```

Once installed you can get started with:

```
// https://facebook.github.io/react-native/docs/getting-started.html
npx react-native start

// and then launch the appropriate simulator
npx react-native run-ios
npx react-native run-android
```

Note, on Android your localhost may not be accessible from the simulator, read the error message carefully and consider running:

```
adb reverse tcp:8081 tcp:8081
```
