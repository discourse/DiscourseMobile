import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  },
  list: {
    padding: 10
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  title: {
    color: "black",
    fontSize: 22,
    fontWeight: "700"
  },
  statusBar: {
    height: 20,
    width: "100%"
  }
});
