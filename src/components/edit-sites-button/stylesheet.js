import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  wrapper: {
    height: 50,
    marginVertical: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  button: {
    borderColor: colors.grayUI,
    borderWidth: 1,
    padding: 5,
    borderRadius: 3
  },
  buttonText: {
    color: colors.grayUI
  }
});
