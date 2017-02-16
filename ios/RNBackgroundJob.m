#import "RNBackgroundJob.h"
#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUtils.h>
#import <React/RCTLog.h>


@implementation RNBackgroundJob {

}


RCT_EXPORT_MODULE();


RCT_EXPORT_METHOD(start:(RCTResponseSenderBlock)callback)
{
  
  
  UIBackgroundTaskIdentifier bgTask = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
    NSLog(@"RNBackgroundJob execution expired!");
    [[UIApplication sharedApplication] endBackgroundTask:bgTask];
  }];
  
  callback(@[[NSNumber numberWithUnsignedLong: bgTask]]);
}


RCT_EXPORT_METHOD(finish:(nonnull NSNumber*)taskId)
{
  [[UIApplication sharedApplication] endBackgroundTask:[taskId unsignedLongValue]];

}


@end
