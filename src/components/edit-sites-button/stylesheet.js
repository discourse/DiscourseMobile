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
    borderColor: colors.grayBorder,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  buttonText: {
    color: colors.grayUI
  }
});
