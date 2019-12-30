/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>
// #import <React/RCTPushNotificationManager.h>
#import <React/RCTLog.h>
// #import <RNBackgroundFetch.h>
#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>

@import Photos;
@import AVFoundation;

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
    moduleName:@"Discourse"
    initialProperties:nil];

  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {}];
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {}];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  // TODO We don't need full release debugging forever, but for now it helps
  RCTSetLogThreshold(RCTLogLevelInfo - 1);

  // config BG fetch
  [application setMinimumBackgroundFetchInterval:UIApplicationBackgroundFetchIntervalMinimum];

  // define UNUserNotificationCenter
  // see https://github.com/zo0r/react-native-push-notification/issues/275
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  
  // show statusbar when returning from a fullscreen video
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(videoExitFullScreen:) name:@"UIWindowDidBecomeHiddenNotification" object:nil];

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


- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
  return [RCTLinkingManager application:application openURL:url
                      sourceApplication:sourceApplication annotation:annotation];
}

// Only if your app is using [Universal Links](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html).
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

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


// -(void)applicationDidEnterBackground:(UIApplication *)application {
// }
// -(void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler{

//   NSMutableDictionary *notification = [NSMutableDictionary dictionaryWithDictionary: userInfo];

//   NSString *state = nil;

//   if(application.applicationState == UIApplicationStateInactive) {
//     state = @"inactive";
//   } else if(application.applicationState == UIApplicationStateBackground){
//     state = @"background";
//   } else {
//     state = @"foreground";
//   }

//   [notification setObject: state forKey: @"AppState"];

//   [RCTPushNotificationManager didReceiveRemoteNotification:notification];

//   completionHandler(UIBackgroundFetchResultNoData);
// }


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


-(void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  NSLog(@"RNBackgroundFetch AppDelegate received fetch event");

  UIBackgroundTaskIdentifier bgTask = [application beginBackgroundTaskWithExpirationHandler:^{
    NSLog(@"RNBackgroundFetch execution expired!");
    completionHandler(UIBackgroundTaskInvalid);
    [application endBackgroundTask:bgTask];
  }];

  void (^wrappedCompletionHandler) (UIBackgroundFetchResult);
  wrappedCompletionHandler = ^(UIBackgroundFetchResult result){
    NSLog(@"RNBackgroundFetch completing fetch");
    completionHandler(result);
    [application endBackgroundTask:bgTask];
  };

//  [RNBackgroundFetch gotBackgroundFetch:wrappedCompletionHandler];

}

- (void)videoExitFullScreen:(id)sender
{
  [[UIApplication sharedApplication] setStatusBarHidden:NO animated:YES];
}

@end
