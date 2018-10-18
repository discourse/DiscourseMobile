import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  topic: {
    display: "flex",
    flex: 1,
    margin: 5,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row"
  },

  title: {
    height: 15,
    width: 200,
    marginVertical: 5,
    backgroundColor: colors.grayBackground
  },

  avatar: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: colors.grayBackground
  }
});
