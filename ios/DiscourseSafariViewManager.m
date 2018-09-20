// This code is taken from https://expo.io/ WebBrowser lib
// The MIT License (MIT)
// Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)
// https://github.com/expo/expo/blob/master/LICENSE

#import <React/RCTUtils.h>
#import <SafariServices/SafariServices.h>
#import "DiscourseSafariViewManager.h"

@interface DiscourseSafariViewManager () <SFSafariViewControllerDelegate>

@property (nonatomic, copy) RCTPromiseResolveBlock redirectResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock redirectReject;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"
@property (nonatomic, strong) SFAuthenticationSession *authSession;
#pragma clang diagnostic pop

@end

NSString *DiscourseSafariViewManagerErrorCode = @"DiscourseSafariViewManager";

@implementation DiscourseSafariViewManager
{
  UIStatusBarStyle _initialStatusBarStyle;
}

RCT_EXPORT_MODULE(DiscourseSafariViewManager)

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(openAuthSessionAsync:(NSString *)authURL
                  redirectURL:(NSString *)redirectURL
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [self initializeWebBrowserWithResolver:resolve andRejecter:reject];


  if (@available(iOS 11, *)) {
    NSURL *url = [[NSURL alloc] initWithString: authURL];
    __weak typeof(self) weakSelf = self;
    void (^completionHandler)(NSURL * _Nullable, NSError *_Nullable) = ^(NSURL* _Nullable callbackURL, NSError* _Nullable error) {
      __strong typeof(weakSelf) strongSelf = weakSelf;
      if (strongSelf) {
        if (!error) {
          NSString *url = callbackURL.absoluteString;
          strongSelf->_redirectResolve(@{
                                         @"type" : @"success",
                                         @"url" : url,
                                         });
        } else {
          strongSelf->_redirectResolve(@{
                                         @"type" : @"cancel",
                                         });
        }
        [strongSelf flowDidFinish];
      }
    };
    _authSession = [[SFAuthenticationSession alloc]
                    initWithURL:url
                    callbackURLScheme:redirectURL
                    completionHandler:completionHandler];
    [_authSession start];
  } else {
      resolve(@{
          @"type" : @"cancel",
          @"message" : @"openAuthSessionAsync requires iOS 11 or greater"
      });
      [self flowDidFinish];
  }
}

RCT_EXPORT_METHOD(openBrowserAsync:(NSString *)authURL
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (![self initializeWebBrowserWithResolver:resolve andRejecter:reject]) {
    return;
  }

  // Safari View Controller to authorize request
  NSURL *url = [[NSURL alloc] initWithString:authURL];
  SFSafariViewController *safariVC = [[SFSafariViewController alloc] initWithURL:url entersReaderIfAvailable:NO];
  safariVC.delegate = self;

  // By setting the modal presentation style to OverFullScreen, we disable the "Swipe to dismiss"
  // gesture that is causing a bug where sometimes `safariViewControllerDidFinish` is not called.
  // There are bugs filed already about it on OpenRadar.
  [safariVC setModalPresentationStyle: UIModalPresentationOverFullScreen];

  // This is a hack to present the SafariViewController modally
  UINavigationController *safariHackVC = [[UINavigationController alloc] initWithRootViewController:safariVC];
  [safariHackVC setNavigationBarHidden:true animated:false];
  [RCTPresentedViewController() presentViewController:safariHackVC animated:true completion:nil];
}

- (BOOL)initializeWebBrowserWithResolver:(RCTPromiseResolveBlock)resolve andRejecter:(RCTPromiseRejectBlock)reject {
  if (_redirectResolve) {
    reject(DiscourseSafariViewManagerErrorCode, @"Another DiscourseSafariViewManager is already being presented.", nil);
    return NO;
  }
  _redirectReject = reject;
  _redirectResolve = resolve;

  _initialStatusBarStyle = RCTSharedApplication().statusBarStyle;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [RCTSharedApplication() setStatusBarStyle:UIStatusBarStyleDefault
                                   animated:YES];
#pragma clang diagnostic pop
  return YES;
}

- (void)_dismissBrowser
{
  __weak typeof(self) weakSelf = self;
  [DiscourseSafariViewManager performSynchronouslyOnMainThread:^{
    [RCTPresentedViewController() dismissViewControllerAnimated:YES completion:^{
      __strong typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf.redirectResolve(@{
                                     @"type": @"dismiss",
                                     });
        [strongSelf flowDidFinish];
      }
    }];
  }];
}

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_sync(dispatch_get_main_queue(), block);
  }
}

RCT_EXPORT_METHOD(dismissBrowser) {
  [self _dismissBrowser];
}

RCT_EXPORT_METHOD(dismissAuthSession) {
  if (@available(iOS 11, *)) {
    [_authSession cancel];
    if (_redirectResolve) {
      _redirectResolve(@{
        @"type": @"dismiss"
      });

      [self flowDidFinish];
    }
  } else {
    [self dismissBrowser];
  }
}


- (void)safariViewControllerDidFinish:(SFSafariViewController *)controller
{
  _redirectResolve(@{
    @"type": @"cancel",
  });
  [self flowDidFinish];
}

-(void)flowDidFinish
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [RCTSharedApplication() setStatusBarStyle:_initialStatusBarStyle animated:YES];
#pragma clang diagnostic pop
  _redirectResolve = nil;
  _redirectReject = nil;
}

@end
