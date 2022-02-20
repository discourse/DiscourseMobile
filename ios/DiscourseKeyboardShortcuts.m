#import "DiscourseKeyboardShortcuts.h"

@implementation DiscourseKeyboardShortcuts

+ (id)allocWithZone:(NSZone *)zone {
    static DiscourseKeyboardShortcuts *sharedInstance = nil;
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

RCT_EXPORT_METHOD(updateFileMenu:(NSArray *)menuItems)
{
  // Update menu items when adding/deleting/reordering sites in React Native
  [[NSUserDefaults standardUserDefaults] setObject:menuItems forKey:@"menuItems"];
}

@end
