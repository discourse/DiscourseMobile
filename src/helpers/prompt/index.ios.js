import { Alert } from "react-native";

export function prompt(title, message, callbacks = []) {
  Alert.alert(title, message, callbacks, { cancelable: false });
}
