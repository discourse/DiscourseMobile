import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  container: {
    display: "flex"
  },
  logo: {
    marginBottom: 5
  },
  text: { textAlign: "center", fontSize: 18, color: "#333" },
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
    borderRadius: 5,
    borderColor: colors.grayBorder,
    borderWidth: 1
  }
});
