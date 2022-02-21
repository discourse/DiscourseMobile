
#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTLog.h>
#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>

#import "DiscourseKeyboardShortcuts.h"

@import Photos;
@import AVFoundation;
@import RNSiriShortcuts;

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

  BOOL launchedFromShortcut = [launchOptions objectForKey:@"UIApplicationLaunchOptionsUserActivityDictionaryKey"] != nil;
  // Add a boolean to the initialProperties to let the app know you got the initial shortcut
  NSDictionary *initialProperties = @{ @"launchedFromShortcut":@(launchedFromShortcut) };

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
    moduleName:@"Discourse"
    initialProperties:initialProperties];

  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {}];
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {}];

  if (@available(iOS 13.0, *)) {
    rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  // TODO We don't need full release debugging forever, but for now it helps
  RCTSetLogThreshold(RCTLogLevelInfo - 1);

  // define UNUserNotificationCenter
  // see https://github.com/zo0r/react-native-push-notification/issues/275
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;

  // show statusbar when returning from a fullscreen video
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(videoExitFullScreen:) name:@"UIWindowDidBecomeHiddenNotification" object:nil];

  return YES;
}

// This method checks for shortcuts issued to the app
- (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *restorableObjects))restorationHandler
{
  UIViewController *viewController = [self.window rootViewController];
  RCTRootView *rootView = (RCTRootView*) [viewController view];

  // If the initial properties say the app launched from a shortcut (see above), tell the library about it.
  if ([[rootView.appProperties objectForKey:@"launchedFromShortcut"] boolValue]) {
    ShortcutsModule.initialUserActivity = userActivity;

    rootView.appProperties = @{ @"launchedFromShortcut":@NO };
  }

  [ShortcutsModule onShortcutReceivedWithUserActivity:userActivity];

  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

// Only if your app is using [Universal Links](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html).
// - (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
//  restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
// {
//   return [RCTLinkingManager application:application
//                    continueUserActivity:userActivity
//                      restorationHandler:restorationHandler];
// }

// Required to register for notifications
- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
  [RNCPushNotificationIOS didRegisterUserNotificationSettings:notificationSettings];
}
// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// From: https://github.com/zo0r/react-native-push-notification/issues/275
// Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler{
  NSLog(@"Discourse notification is delivered to a foreground app");
  completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge);
}

// Called when a user taps on a notification in the foreground
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  NSMutableDictionary *userData = [NSMutableDictionary dictionaryWithDictionary:response.notification.request.content.userInfo];
  [userData setObject:@(1) forKey:@"openedInForeground"];
  [RNCPushNotificationIOS didReceiveRemoteNotification:userData];
  completionHandler();
}

// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}
// Required for the registrationError event.
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}
// Required for the localNotification event.
- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
  [RNCPushNotificationIOS didReceiveLocalNotification:notification];
}


- (void)videoExitFullScreen:(id)sender
{
  [[UIApplication sharedApplication] setStatusBarHidden:NO animated:YES];
}

// Custom handler for keyboard events

- (NSArray *)keyCommands {
  // store ⌘+(1,2,3...) shortcuts as site mappings
  // used for keyboard but also File menu items
  
  NSArray *userMenuItems = [[NSUserDefaults standardUserDefaults] objectForKey:@"menuItems"];
  NSMutableArray *menuItems = [NSMutableArray array];
  NSUInteger index = 1;
  
  for(NSString* value in userMenuItems){
    if (index < 10) {
      NSString* key = [NSString stringWithFormat:@"%lu", (unsigned long)index];
      SEL selName = NSSelectorFromString([NSString stringWithFormat:@"send%@", key]);

      [menuItems addObject:[UIKeyCommand keyCommandWithInput:key modifierFlags:UIKeyModifierCommand action:selName discoverabilityTitle:value]];
      index++;
    }
  }

  [menuItems addObject:[UIKeyCommand keyCommandWithInput:@"W" modifierFlags:UIKeyModifierCommand action:@selector(sendW) discoverabilityTitle:@"Dismiss"]];

  return menuItems;
}

- (void)send1 {
  [self sendKey:@"1"];
}

- (void)send2 {
  [self sendKey:@"2"];
}

- (void)send3 {
  [self sendKey:@"3"];
}

- (void)send4 {
  [self sendKey:@"4"];
}

- (void)send5 {
  [self sendKey:@"5"];
}

- (void)send6 {
  [self sendKey:@"6"];
}

- (void)send7 {
  [self sendKey:@"7"];
}

- (void)send8 {
  [self sendKey:@"8"];
}

- (void)send9 {
  [self sendKey:@"9"];
}

- (void)sendW {
  [self sendKey:@"W"];
}

- (void)sendKey:(NSString *)input {
  DiscourseKeyboardShortcuts *emitter = [DiscourseKeyboardShortcuts allocWithZone: nil];
  [emitter sendEvent:input];
}

// called once at startup, to build/modify the main app menu in macOS
- (void)buildMenuWithBuilder:(id<UIMenuBuilder>)builder {

    [builder removeMenuForIdentifier:UIMenuFormat];
    [builder removeMenuForIdentifier:UIMenuView];
    [builder removeMenuForIdentifier:UIMenuHelp];
    
    // replace File menu (also removes default shortcut for ⌘+W)
    NSArray *keyCommands = [self keyCommands];
    [builder replaceChildrenOfMenuForIdentifier:UIMenuFile fromChildrenBlock:^NSArray* (NSArray* children) {return keyCommands;}];
  
}
@end
