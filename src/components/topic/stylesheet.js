import { StyleSheet } from "react-native";
import colors from "../../colors";

export default StyleSheet.create({
  topic: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 5
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blueUnread,
    marginRight: 5
  },

  newPostsIndicator: {
    color: "white",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: colors.blueUnread,
    marginHorizontal: 3
  },

  unreadPostsIndicator: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: colors.grayUILight,
    marginHorizontal: 3
  }
});
