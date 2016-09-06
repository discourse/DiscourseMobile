#import "RNBackgroundJob.h"
#import <UIKit/UIKit.h>

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"
#import "RCTLog.h"


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
