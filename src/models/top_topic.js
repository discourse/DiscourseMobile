import Api from "Libs/api";
import _ from "lodash";

export default class TopTopic {
  constructor(site) {
    this.site = site;
    this.apiClient = new Api(site);
  }

  static startTracking(site, lists = ["unread", "new"]) {
    const topTopic = new TopTopic(site);

    const promises = lists.map(list => topTopic._fetchFilter(list));

    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then(async responses => {
          const defaultResponse = {
            topic_list: {
              topics: []
            },
            users: []
          };

          const unreads = responses[0] || defaultResponse;
          const news = responses[1] || defaultResponse;

          if (Array.isArray(unreads) || Array.isArray(news)) {
            return [];
          }

          let topics = unreads.topic_list.topics
            .concat(news.topic_list.topics)
            .sort((t1, t2) => {
              return new Date(t2.bumped_at) - new Date(t1.bumped_at);
            });

          let users = _.uniq((unreads.users || []).concat(news.users || []));

          if (topics.length) {
            resolve(topTopic._formatList(site, topics, users));
          } else {
            reject();
          }
        })
        .catch(e => resolve(site.topics));
    });
  }

  _fetchFilter(filter) {
    return new Promise((resolve, reject) => {
      const endpoint = `/${filter}.json`;

      this.apiClient
        .fetch(endpoint)
        .then(topics => resolve(topics))
        .catch(e => reject(e))
        .done();
    });
  }

  _formatList(site, topics, users) {
    return topics.map(topic => {
      const lastPosterId = topic.posters.find(
        poster => poster.extras && poster.extras.includes("latest")
      ).user_id;

      const lastPoster = users.find(user => user.id === lastPosterId);

      const avatarURL = lastPoster.avatar_template.replace("{size}", 120);

      return {
        id: topic.id,
        title: topic.title,
        notificationLevel: topic.notification_level,
        highestPostNumber: topic.highest_post_number,
        mostRecentPosterAvatar: avatarURL.includes("http")
          ? avatarURL
          : `${site.url}${avatarURL}`,
        unreadPosts: topic.unread || topic.highest_post_number,
        newPosts: topic.new_posts,
        lastReadPostNumber: topic.last_read_post_number
      };
    });
  }
}
