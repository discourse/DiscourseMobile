// This code is taken from https://expo.io/ WebBrowser lib
// The MIT License (MIT)
// Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)
// https://github.com/expo/expo/blob/master/LICENSE

#import <UIKit/UIKit.h>
#import <React/RCTBridgeModule.h>

@interface DiscourseSafariViewManager : NSObject <RCTBridgeModule>

- (void)performSynchronouslyOnMainThread:(void (^)(void))block;

@end
