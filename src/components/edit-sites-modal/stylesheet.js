import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  wrapper: {
    display: "flex",
    flex: 1
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.grayUILight
  },
  title: {
    flex: 1,
    paddingVertical: 10,
    textAlign: "center"
  },
  closeModalButton: {
    position: "absolute",
    top: 5,
    right: 10,
    padding: 10
  },
  closeModalButtonText: {
    color: colors.blueCallToAction
  },
  body: {}
});
