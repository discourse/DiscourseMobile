/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTPushNotificationManager.h>
#import <React/RCTLog.h>
#import "RNBackgroundFetch.h"
#import "Orientation.h"
#import <Fabric/Fabric.h>
#import <Crashlytics/Crashlytics.h>


@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [Fabric with:@[[Crashlytics class]]];

  NSURL *jsCodeLocation;

  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios" fallbackResource:nil];


  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"Discourse"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
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

  return YES;
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
  [RCTPushNotificationManager didRegisterUserNotificationSettings:notificationSettings];
}
// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

-(void)applicationDidEnterBackground:(UIApplication *)application {
}
-(void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler{

  NSMutableDictionary *notification = [NSMutableDictionary dictionaryWithDictionary: userInfo];

  NSString *state = nil;

  if(application.applicationState == UIApplicationStateInactive) {
    state = @"inactive";
  } else if(application.applicationState == UIApplicationStateBackground){
    state = @"background";
  } else {
    state = @"foreground";
  }

  [notification setObject: state forKey: @"AppState"];

  [RCTPushNotificationManager didReceiveRemoteNotification:notification];

  completionHandler(UIBackgroundFetchResultNoData);
}


// Required for the localNotification event.
- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
  [RCTPushNotificationManager didReceiveLocalNotification:notification];
}
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  NSLog(@"%@", error);
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

  [RNBackgroundFetch gotBackgroundFetch:wrappedCompletionHandler];

}

- (UIInterfaceOrientationMask)application:(UIApplication *)application supportedInterfaceOrientationsForWindow:(UIWindow *)window {
  return [Orientation getOrientation];
}

@end
