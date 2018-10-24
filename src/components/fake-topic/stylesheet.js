import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  topic: {
    display: "flex",
    flex: 1,
    margin: 5,
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row"
  },

  title: {
    height: 15,
    marginVertical: 5,
    backgroundColor: colors.grayBackground
  },

  avatar: {
    marginRight: 10,
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: colors.grayBackground
  }
});
