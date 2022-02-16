#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface DiscEventEmitter : RCTEventEmitter<RCTBridgeModule>

- (void) sendEvent:(NSString *)eventName;

@end
