#import "DiscEventEmitter.h"

@implementation DiscEventEmitter

+ (id)allocWithZone:(NSZone *)zone {
    static DiscEventEmitter *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [super allocWithZone:zone];
    });
    return sharedInstance;
}


+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"keyInputEvent"];
}

- (void) sendEvent:(NSString *)eventInput {
  [self sendEventWithName:@"keyInputEvent" body:@{@"input": eventInput}];
}

RCT_EXPORT_METHOD(quitApp)
{
  // React Native can call quitApp on Command + W
  exit(9);
}

@end
