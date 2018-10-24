import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  outterButton: {},
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.grayUI,
    borderRadius: 21,
    width: 42,
    height: 42
  },
  icon: {
    color: "white"
  }
});
