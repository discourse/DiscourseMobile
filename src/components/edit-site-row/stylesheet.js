import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  row: {
    display: "flex",
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginVertical: 0,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.grayUILight
  },

  left: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15
  },
  right: {
    display: "flex",
    flex: 1,
    flexDirection: "column"
  },
  trashIcon: {
    color: colors.redDanger
  },
  title: {},
  subtitle: {}
});
