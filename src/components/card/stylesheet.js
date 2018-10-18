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
  title: { color: "#333", marginLeft: 10 },
  card: {
    marginTop: 10,
    display: "flex",
    backgroundColor: "white",
    borderColor: colors.grayUILight,
    borderWidth: 1,
    borderRadius: 5,
    flexDirection: "column"
  },
  cardBody: { display: "flex", flex: 1 },
  cardHeader: {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    overflow: "hidden",
    padding: 5,
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

  notifications: {
    display: "flex",
    flexDirection: "column"
  },

  notificationsSeparator: {
    display: "flex",
    flex: 1,
    height: 1,
    backgroundColor: colors.grayUILight,
    marginVertical: 10
  },

  notificationsCount: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },

  unreadNotifications: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    marginHorizontal: 5
  },
  unreadNotificationsCount: {
    minWidth: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "transparent",
    marginRight: 5,
    padding: 2,
    backgroundColor: colors.blueUnread
  },
  unreadNotificationsCountText: {
    color: "white"
  },
  unreadNotificationsText: {
    color: colors.blueUnread
  },

  unreadPrivateMessages: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    marginHorizontal: 5
  },
  unreadPrivateMessagesCount: {
    minWidth: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "transparent",
    marginRight: 5,
    padding: 2,
    backgroundColor: colors.greenPrivateUnread
  },
  unreadPrivateMessagesCountText: {
    color: "white"
  },
  unreadPrivateMessagesText: {
    color: colors.greenPrivateUnread
  },

  topics: {
    marginHorizontal: 5
  },

  unreadAndNew: {},

  showMore: {},
  showMoreButtonWrapper: {
    backgroundColor: colors.grayUILight,
    padding: 5,
    marginTop: 5
  },
  showMoreButton: { color: colors.graySubtitle, textAlign: "center" }
});
