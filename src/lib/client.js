import randomBytes from "Libs/random-bytes";
import { AsyncStorage } from "react-native";

const STORAGE_KEY = "@ClientId";

export default class Client {
  constructor() {
    this._id = null;
  }

  setId(newId) {
    return new Promise(resolve => {
      AsyncStorage.setItem(STORAGE_KEY, newId).then(() => {
        this._id = newId;
        console.log(`[CLIENT] set id: ${this._id}`);
        resolve(this._id);
      });
    });
  }

  getId() {
    return new Promise(resolve => {
      if (this._id) {
        console.log(`[CLIENT] get id from current object: ${this._id}`);
        resolve(this._id);
      } else {
        AsyncStorage.getItem(STORAGE_KEY).then(_id => {
          if (_id && _id.length > 0) {
            this._id = _id;
            console.log(`[CLIENT] get id from storage: ${this._id}`);
            resolve(this._id);
          } else {
            this._id = randomBytes(32);
            AsyncStorage.setItem(STORAGE_KEY, this._id).then(() => {
              console.log(`[CLIENT] generate and store id: ${this._id}`);
              resolve(this._id);
            });
          }
        });
      }
    });
  }
}
