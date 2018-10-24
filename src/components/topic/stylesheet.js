import { StyleSheet } from "react-native";
import colors from "Root/colors";

export default StyleSheet.create({
  topic: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    paddingHorizontal: 5
  },

  topicTitle: {
    maxWidth: "80%",
    marginRight: 5
  },

  topicMostRecentPoster: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: colors.grayBackground,
    marginRight: 5
  },

  newTopicIndicator: {
    color: "white",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blueUnread
  },

  postsCountIndicator: {
    color: "white",
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginLeft: "auto"
  },

  newPostsIndicator: {
    color: "white",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: colors.blueUnread,
    marginLeft: "auto"
  },

  unreadPostsIndicator: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginLeft: "auto"
  }
});
