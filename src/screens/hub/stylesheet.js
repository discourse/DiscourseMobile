import { StyleSheet } from "react-native";
import colors from "Root/colors";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  },
  list: {
    flex: 1,
    paddingBottom: 15
  },
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
  },

  text: {
    fontSize: 16,
    padding: 32,
    textAlign: "center"
  },
  addSiteButtonText: {
    backgroundColor: colors.blueCallToAction,
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    padding: 8,
    textAlign: "center"
  },
  title: {
    color: colors.grayTitle,
    fontWeight: "500"
  },
  subtitle: {
    color: colors.graySubtitle
  },
  rowWrapper: {
    marginRight: 16,
    marginLeft: 16
  },
  row: {
    borderLeftColor: colors.grayBorder,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.grayBorder,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.grayBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    padding: 12,
    backgroundColor: "white"
  },
  icon: {
    alignSelf: "center",
    height: 40,
    width: 40
  },
  info: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingLeft: 12
  },
  url: {
    color: colors.grayTitle,
    fontSize: 16,
    fontWeight: "normal"
  },
  description: {
    color: colors.graySubtitle,
    flex: 10,
    fontSize: 14
  },
  connect: {
    alignSelf: "flex-start",
    backgroundColor: colors.blueCallToAction,
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
    marginBottom: 6,
    overflow: "hidden",
    padding: 6
  },
  suggestedSitesContainer: {},
  addSiteContainer: {
    marginTop: 15
  },
  addFirstSiteContainer: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    backgroundColor: colors.grayBackground
  },

  addSiteButtonWrapper: {
    marginBottom: 32
  }
});
