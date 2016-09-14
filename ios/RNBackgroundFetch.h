#import "RCTEventEmitter.h"

@interface RNBackgroundFetch : RCTEventEmitter

+ (void)gotBackgroundFetch:(void (^)(UIBackgroundFetchResult))completionHandler;

@end
