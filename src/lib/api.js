import { Platform } from "react-native";
import Client from "Libs/client";
import { RateLimit } from "Libs/errors";

export default class Api {
  constructor(site) {
    this.site = site;
    this.clientId = null;
  }

  async fetch(path, method, data) {
    method = method || "GET";

    path = `${this.site.url}${path}`;

    this.clientId = this.clientId || (await new Client().getId());

    let headers = {
      "User-Api-Key": this.site.authToken,
      "User-Agent": `Discourse ${Platform.OS} App / 1.0`,
      "Content-Type": "application/json",
      "Dont-Chunk": "true",
      "User-Api-Client-Id": this.clientId
    };

    if (data) {
      data = JSON.stringify(data);
    }

    return new Promise((resolve, reject) => {
      let req = new Request(path, {
        headers,
        method,
        body: data
      });

      console.log(`[API] ${method} ${path}`, headers, data);

      fetch(req)
        .then(r1 => {
          if (r1.status === 429) {
            throw new RateLimit();
          }

          if (r1.status === 200) {
            return r1.json();
          } else {
            if (r1.status === 403) {
              this.site.logoff();
              throw "User was logged off!";
            } else {
              throw "Error during fetch status code:" + r1.status;
            }
          }
        })
        .then(result => resolve(result))
        .catch(e => {
          console.log(`[API] Failed ${method} ${path} : ${e.message}`);
          reject(e);
        })
        .done();
    });
  }
}
