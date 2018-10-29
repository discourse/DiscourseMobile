import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  container: {
    display: "flex"
  },
  logo: {
    marginBottom: 5
  },
  text: { textAlign: "center", color: "#333" },
  addSiteButtonText: {
    marginVertical: 10,
    color: colors.blueCallToAction
  },
  card: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.grayBackground,
    padding: 10,
    borderColor: colors.grayBorder,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 15
  }
});
