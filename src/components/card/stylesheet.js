import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  container: {
    display: "flex"
  },
  logo: {
    height: 32,
    width: 32
  },
  title: { color: "#333", marginLeft: 10, maxWidth: "65%" },
  card: {
    marginTop: 10,
    display: "flex",
    backgroundColor: "white",
    borderColor: colors.grayBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "column"
  },
  cardBody: { display: "flex", flex: 1 },
  cardHeader: {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
    padding: 10,
    justifyContent: "space-between",
    alignItems: "center"
  },

  site: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row"
  },

  connect: {
    alignItems: "center",
    justifyContent: "center"
  },

  connectButton: {
    padding: 5,
    backgroundColor: colors.blueCallToAction
  },

  connectButtonText: {
    color: "white"
  },
  connectButtonWrapper: {},

  notificationsWrapper: {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap"
  },

  notifications: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    marginRight: 10,
    marginVertical: 5
  },

  notificationsCount: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    marginRight: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "white"
  },
  notificationsCountText: {
    color: "white",
    paddingVertical: 6,
    paddingHorizontal: 8
  },

  topics: {
    marginHorizontal: 5
  },

  unreadAndNew: {},

  showMore: {
    marginLeft: "auto"
  },
  showMoreButtonWrapper: {
    backgroundColor: colors.grayUILight,
    paddingVertical: 10,
    paddingHorizontal: 15
  },
  showMoreButton: { color: colors.graySubtitle, textAlign: "center" },

  notificationsSeparator: {
    display: "flex",
    flex: 1,
    height: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.grayUILight,
    marginBottom: 8,
    marginTop: 8
  },

  footer: {
    display: "flex"
  },

  footerActions: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5
  }
});
