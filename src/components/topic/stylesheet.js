import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  topic: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3
  },

  topicTitle: {
    maxWidth: "75%"
  },

  topicMostRecentPoster: {
    marginLeft: "auto",
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: colors.grayBackground
  },

  newTopicIndicator: {
    color: "white",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blueUnread,
    marginRight: 5
  },

  newTopicIndicatorWithUnread: {
    color: "white",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: colors.blueUnread,
    marginRight: 5
  },

  unreadTopicIndicator: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: colors.grayUILight,
    marginRight: 5
  }
});
