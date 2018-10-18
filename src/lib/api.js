import { Platform } from "react-native";

export default class Api {
  constructor(site) {
    this.site = site;
    this._currentFetch = null;
  }

  fetch(path, method, data) {
    method = method || "GET";

    let headers = {
      "User-Api-Key": this.site.authToken,
      "User-Agent": `Discourse ${Platform.OS} App / 1.0`,
      "Content-Type": "application/json",
      "Dont-Chunk": "true",
      "User-Api-Client-Id": this.site.clientId || ""
    };

    if (data) {
      data = JSON.stringify(data);
    }

    // if (this._background) {
    //   return new Promise((resolve, reject) =>
    //     reject("In background mode aborting start request!")
    //   );
    // }

    return new Promise((resolve, reject) => {
      let req = new Request(path, {
        headers,
        method,
        body: data
      });
      this._currentFetch = fetch(req);
      this._currentFetch
        .then(r1 => {
          // if (this._background) {
          //   throw "In Background mode aborting request!";
          // }
          if (r1.status === 200) {
            return r1.json();
          } else {
            if (r1.status === 403) {
              // this.logoff();
              throw "User was logged off!";
            } else {
              throw "Error during fetch status code:" + r1.status;
            }
          }
        })
        .then(result => resolve(result))
        .catch(e => reject(e))
        .finally(() => {
          this._currentFetch = undefined;
        })
        .done();
    });
  }
}
