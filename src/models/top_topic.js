import Api from "../api";

export default class TopTopic {
  constructor(site) {
    this.site = site;
    this._apiClient = new Api(site);
  }

  static startTracking(site) {
    const topTopic = new TopTopic(site);

    return Promise.all([
      topTopic._fetchTopDaily(),
      topTopic._fetchTopicsTrackingState()
    ]).then(responses => {
      const top = responses[0];
      const trackedTopics = responses[1];

      console.log("-----", topTopic.site.url, top, trackedTopics);

      return top.topic_list.topics.slice(0, 4).map(topic => {
        const mostRecentPosterId = topic.posters.find(p => {
          return p.description.includes("Most Recent Poster");
        }).user_id;

        const mostRecentPoster = top.users.find(u => {
          return u.id === mostRecentPosterId;
        });

        const avatarURL = mostRecentPoster.avatar_template.replace(
          "{size}",
          240
        );

        const trackedTopic = trackedTopics.find(x => x.topic_id === topic.id);

        let isNewTopic = false;
        if (trackedTopic) {
          const lastReadPostNumber = Number(trackedTopic.last_read_post_number);
          if (lastReadPostNumber > 0) {
            isNewTopic = false;
          }
        }

        let unreadPosts = 0;
        if (trackedTopic) {
          const lastReadPostNumber = Number(trackedTopic.last_read_post_number);
          const highestPostNumber = Number(trackedTopic.highest_post_number);
          unreadPosts = highestPostNumber - lastReadPostNumber;
        }

        console.log("dd", trackedTopics, trackedTopic, {
          id: topic.id,
          title: topic.unicode_title || topic.title,
          mostRecentPosterAvatar: avatarURL.includes("http")
            ? avatarURL
            : `${site.url}${avatarURL}`,
          new: isNewTopic,
          unreadPosts
        });

        return {
          id: topic.id,
          title: topic.unicode_title || topic.title,
          mostRecentPosterAvatar: avatarURL.includes("http")
            ? avatarURL
            : `${site.url}${avatarURL}`,
          new: isNewTopic,
          unreadPosts
        };
      });
    });
  }

  _fetchTopDaily() {
    return fetch(`${this.site.url}/top/quarterly.json`).then(response => {
      console.log("_fetchTopDaily", response);
      if (response.url && response.url.includes("/login")) {
        return {
          topic_list: {
            topics: []
          },
          users: []
        };
      } else {
        return response.json();
      }
    });
  }

  _fetchTopicsTrackingState() {
    return new Promise((resolve, reject) => {
      const endpoint = `${
        this.site.url
      }/users/joffreyjaffeux/topic-tracking-state.json`;

      this._apiClient
        .fetch(endpoint)
        .then(topics => resolve(topics))
        .catch(() => resolve([]))
        .done();
    });
  }
}
