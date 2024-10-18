//
//  ShareViewController.swift
//  ShareExtension
//
//  Shows a Discourse icon in the iOS share sheet
// and lets users send URLs to the app.
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

                  DispatchQueue.main.async {
                    if let application = UIApplication.value(forKeyPath: #keyPath(UIApplication.shared)) as? UIApplication {
                        application.open(URL(string: "discourse://share?sharedUrl=\(url)")!, options: [:], completionHandler: nil)
                    }
                  }
              }
          } else if attachment.isText {
              attachment.processText { obj, err in
                  guard err == nil else {
                      return
                  }

                  guard let url = URL(string: obj as! String) else {
                      return
                  }

                  DispatchQueue.main.async {
                    if let application = UIApplication.value(forKeyPath: #keyPath(UIApplication.shared)) as? UIApplication {
                        application.open(URL(string: "discourse://share?sharedUrl=\(url)")!, options: [:], completionHandler: nil)
                    }
                  }
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

}
