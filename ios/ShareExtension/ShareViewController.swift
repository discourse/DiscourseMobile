//
//  ShareViewController.swift
//  ShareExtension
//
//  Created by Penar Musaraj on 2020-02-13.
//  Copyright © 2020 Facebook. All rights reserved.
//

import UIKit
import MobileCoreServices

extension NSItemProvider {
    var isText: Bool { return hasItemConformingToTypeIdentifier(String(kUTTypeText)) }
    var isUrl: Bool { return hasItemConformingToTypeIdentifier(String(kUTTypeURL)) }

    func processText(completion: CompletionHandler?) {
        loadItem(forTypeIdentifier: String(kUTTypeText), options: nil, completionHandler: completion)
    }

    func processUrl(completion: CompletionHandler?) {
        loadItem(forTypeIdentifier: String(kUTTypeURL), options: nil, completionHandler: completion)
    }
}

class ShareViewController: UIViewController {
  override func viewDidLoad() {
    super.viewDidLoad()

    guard let extensionContext = extensionContext,
          let inputItems = extensionContext.inputItems as? [NSExtensionItem] else {
        return
    }

    for inputItem in inputItems {
        guard let attachments = inputItem.attachments else { continue }

        for attachment in attachments {
          if attachment.isUrl {
              attachment.processUrl { obj, err in
                  guard err == nil else {
                      return
                  }

                  guard let url = obj as? URL else {
                      return
                  }
                  self.openURL(URL(string: "discourse://share?sharedUrl=\(url)")!)
              }
          }

          if attachment.isText {
              attachment.processText { obj, err in
                  guard err == nil else {
                      return
                  }

                  guard let url = URL(string: obj as! String) else {
                      return
                  }
                  self.openURL(URL(string: "discourse://share?sharedUrl=\(url)")!)
              }
          }
      }
    }
    UIView.animate(withDuration: 0.2, delay: 0, options: [], animations: {
        self.view.alpha = 0
    }, completion: { _ in
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    })

  }

  @objc func openURL(_ url: URL) {
    var responder: UIResponder? = self
    while responder != nil {
        if let application = responder as? UIApplication {
          application.perform(#selector(openURL(_:)), with: url)
          break
        }
        responder = responder?.next
    }
  }
}
