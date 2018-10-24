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
    borderColor: colors.grayBorder,
    borderTopWidth: 1,
    borderBottomWidth: 1,
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

  notifications: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    marginHorizontal: 5,
    marginTop: 5,
    marginBottom: 10
  },

  notificationsCount: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-start"
  },

  unreadNotifications: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    marginRight: 10
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
    flexDirection: "row"
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

  showMore: {
    marginLeft: "auto"
  },
  showMoreButtonWrapper: {
    backgroundColor: colors.grayUILight,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  showMoreButton: { color: colors.graySubtitle, textAlign: "center" },

  notificationsSeparator: {
    display: "flex",
    flex: 1,
    height: 1,
    backgroundColor: colors.grayBorder,
    marginBottom: 10,
    marginTop: 0
  }
});
