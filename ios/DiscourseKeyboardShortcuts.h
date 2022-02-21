#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface DiscourseKeyboardShortcuts : RCTEventEmitter<RCTBridgeModule>

- (void) sendEvent:(NSString *)eventName;

@end
