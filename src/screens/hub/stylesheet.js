import { StyleSheet } from "react-native";
import colors from "Root/colors";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  },
  list: {},
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 10
  },
  title: {
    color: "#333"
  },
  statusBar: {
    height: 20,
    width: "100%"
  },

  addingSiteText: {
    color: "white",
    paddingHorizontal: 15,
    paddingVertical: 10
  },

  addingSiteContainer: {
    display: "flex",
    backgroundColor: colors.blueCallToAction
  }
});
