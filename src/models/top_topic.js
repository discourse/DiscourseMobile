import Api from "Libs/api";
import _ from "lodash";

export default class TopTopic {
  constructor(site) {
    this.site = site;
    this._apiClient = new Api(site);
  }

  static startTracking(site) {
    const topTopic = new TopTopic(site);

    return Promise.all([topTopic._fetchUnread(), topTopic._fetchNew()]).then(
      responses => {
        if (Array.isArray(responses[0]) || Array.isArray(responses[1])) {
          return [];
        }

        const topics = responses[0].topic_list.topics
          .concat(responses[1].topic_list.topics)
          .sort((t1, t2) => {
            return new Date(t2.bumped_at) - new Date(t1.bumped_at);
          });

        const users = _.uniq(responses[0].users.concat(responses[1].users));

        return topics.map(topic => {
          const lastPosterId = topic.posters.find(
            poster => poster.extras && poster.extras.includes("latest")
          ).user_id;

          const lastPoster = users.find(user => user.id === lastPosterId);

          const avatarURL = lastPoster.avatar_template.replace("{size}", 120);

          return {
            id: topic.id,
            title: topic.title,
            mostRecentPosterAvatar: avatarURL.includes("http")
              ? avatarURL
              : `${site.url}${avatarURL}`,
            unreadPosts: topic.unread || topic.highest_post_number,
            newPosts: topic.new_posts
          };
        });
      }
    );
  }

  _fetchFilter(filter) {
    return new Promise((resolve, reject) => {
      const endpoint = `${this.site.url}/${filter}.json`;

      this._apiClient
        .fetch(endpoint)
        .then(topics => resolve(topics))
        .catch(() => resolve([]))
        .done();
    });
  }

  _fetchUnread() {
    return this._fetchFilter("unread");
  }

  _fetchNew() {
    return this._fetchFilter("new");
  }
}
