/* @flow */
'use strict';

import React from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Linking,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import DiscoverComponents from './DiscoverScreenComponents';
import { ThemeContext } from '../ThemeContext';
import Site from '../site';
import i18n from 'i18n-js';
import fetch from './../../lib/fetch';
import { debounce } from 'lodash';
import Toast, { BaseToast } from 'react-native-toast-message';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

const toastConfig = {
  success: props => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: 'transparent' }}
      onPress={() => {
        if (Platform.OS === 'android') {
          Linking.openSettings();
        }
        if (Platform.OS === 'ios') {
          Linking.openURL('App-Prefs:NOTIFICATIONS_ID');
        }
      }}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      text1Style={{
        fontSize: 17,
        fontWeight: '400',
      }}
      text2Style={{
        fontSize: 17,
      }}
    />
  ),
};

const VIEWS = {
  SPLASH: 'splash',
  SEARCH: 'search',
  TAG_DETAIL: 'tagDetail',
  ALL_COMMUNITIES: 'allCommunities',
  COMMUNITY_DETAIL: 'communityDetail',
};

const defaultView = VIEWS.SPLASH;

const FALLBACK_TAGS = [
  'ai',
  'finance',
  'apple',
  'automation',
  'media',
  'research',
  'smart-home',
  'linux',
  'open-source',
  'webdev',
  'health',
  'gaming',
  'audio',
  'programming-language',
  'devops',
  'crypto',
  'mapping',
];

class DiscoverScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // View navigation
      view: defaultView,
      previousView: defaultView,

      // Tag splash
      splashTags: [],
      splashTagsLoading: true,

      // Search mode (existing behavior)
      term: '',
      results: [],
      loading: false,
      page: 1,
      selectedTag: '',
      hasMoreResults: false,
      selectionCount: 0,

      // Tag detail
      activeTag: null,
      tagCommunities: [],
      tagCommunitiesLoading: true,
      hotTopics: [],
      hotTopicsLoading: true,
      hotTopicsPage: 1,
      hotTopicsHasMore: false,

      // Community detail
      activeCommunity: null,
      communityTopics: [],
      communityTopicsLoading: true,
      communityTopicsPage: 1,
      communityTopicsHasMore: false,

      largerUI: props.screenProps.largerUI,
    };

    this._siteManager = this.props.screenProps.siteManager;
    this.baseUrl = `${Site.discoverUrl()}search.json?q=`;
    this.maxPageNumber = 10;

    this.debouncedSearch = debounce(this.doSearch, 750);

    this.fetchSplashTags();
  }

  componentDidMount() {
    this._unsubscribeTabPress = this.props.navigation.addListener(
      'tabPress',
      () => {
        if (
          this.props.navigation.isFocused() &&
          this.state.view !== VIEWS.SPLASH
        ) {
          this._navigateToSplash();
        }
      },
    );

    if (Platform.OS === 'android') {
      this._backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (
            this.state.view !== VIEWS.SPLASH &&
            this.state.view !== VIEWS.SEARCH
          ) {
            this._navigateBack();
            return true;
          }
          return false;
        },
      );
    }
  }

  componentWillUnmount() {
    if (this._unsubscribeTabPress) {
      this._unsubscribeTabPress();
    }
    if (this._backHandler) {
      this._backHandler.remove();
    }
  }

  // ── API Methods ──

  fetchSplashTags() {
    const url = `${Site.discoverUrl()}discover/hot-topics-tags.json`;

    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (json.tags && json.tags.length > 0) {
          this.setState({ splashTags: json.tags, splashTagsLoading: false });
        } else {
          this.setState({
            splashTags: FALLBACK_TAGS,
            splashTagsLoading: false,
          });
        }
      })
      .catch(() => {
        this.setState({ splashTags: FALLBACK_TAGS, splashTagsLoading: false });
      });
  }

  onSelectTag(tag) {
    this.setState({
      activeTag: tag,
      hotTopics: [],
      hotTopicsLoading: true,
      hotTopicsPage: 1,
      hotTopicsHasMore: false,
      tagCommunities: [],
      tagCommunitiesLoading: true,
      view: VIEWS.TAG_DETAIL,
    });

    this._fetchTagCommunities(tag);
    this._fetchHotTopicsForTag(tag);
  }

  _fetchHotTopicsForTag(tag) {
    const url = `${Site.discoverUrl()}discover/hot-topics.json?tag=${encodeURIComponent(
      tag,
    )}&page=1`;

    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (tag !== this.state.activeTag) {
          return; // stale response
        }

        const topics = json.hot_topics || [];
        this.setState({
          hotTopics: topics,
          hotTopicsLoading: false,
          hotTopicsHasMore: Boolean(json.more_topics_url),
        });

        if (topics.length === 0) {
          this.setState({
            view: VIEWS.ALL_COMMUNITIES,
            previousView: VIEWS.SPLASH,
          });
        }
      })
      .catch(e => {
        console.log(e);
        if (tag !== this.state.activeTag) {
          return;
        }
        this.setState({ hotTopicsLoading: false });
      });
  }

  fetchHotTopics(tag, opts = {}) {
    const page = opts.pageNumber || 1;
    const url = `${Site.discoverUrl()}discover/hot-topics.json?tag=${encodeURIComponent(
      tag,
    )}&page=${page}`;

    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (tag !== this.state.activeTag) {
          return;
        }

        if (json.hot_topics) {
          this.setState(prevState => ({
            hotTopics: opts.append
              ? prevState.hotTopics.concat(json.hot_topics)
              : json.hot_topics,
            hotTopicsLoading: false,
            hotTopicsHasMore: Boolean(json.more_topics_url),
          }));
        } else {
          this.setState(prevState => ({
            hotTopics: opts.append ? prevState.hotTopics : [],
            hotTopicsLoading: false,
            hotTopicsHasMore: false,
          }));
        }
      })
      .catch(e => {
        console.log(e);
        this.setState({ hotTopicsLoading: false });
      });
  }

  _fetchTagCommunities(tag) {
    const searchString = `#discover #${tag} order:featured`;
    const url = `${this.baseUrl}${encodeURIComponent(searchString)}&page=1`;

    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (tag !== this.state.activeTag) {
          return;
        }

        if (json.topics) {
          this.setState({
            tagCommunities: json.topics,
            tagCommunitiesLoading: false,
          });
        } else {
          this.setState({ tagCommunities: [], tagCommunitiesLoading: false });
        }
      })
      .catch(e => {
        console.log(e);
        this.setState({ tagCommunitiesLoading: false });
      });
  }

  onPressCommunity(community) {
    this.setState({
      activeCommunity: community,
      communityTopics: [],
      communityTopicsLoading: true,
      communityTopicsPage: 1,
      communityTopicsHasMore: false,
      view: VIEWS.COMMUNITY_DETAIL,
      previousView: this.state.view,
    });

    this._fetchCommunityHotTopics(community.featured_link);
  }

  _fetchCommunityHotTopics(communityUrl, opts = {}) {
    const page = opts.page || 0;
    const url = `${communityUrl}/hot.json?page=${page}`;

    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (communityUrl !== this.state.activeCommunity?.featured_link) {
          return;
        }

        const rawTopics = (json.topic_list && json.topic_list.topics) || [];
        const topics = rawTopics.map(topic => ({
          ...topic,
          url: `${communityUrl}/t/${topic.slug}/${topic.id}`,
        }));

        this.setState(prevState => ({
          communityTopics: opts.append
            ? prevState.communityTopics.concat(topics)
            : topics,
          communityTopicsLoading: false,
          communityTopicsHasMore: Boolean(json.topic_list?.more_topics_url),
        }));
      })
      .catch(e => {
        console.log(e);
        this.setState({ communityTopicsLoading: false });
      });
  }

  _fetchNextCommunityTopicsPage() {
    if (this.state.communityTopicsHasMore && this.state.activeCommunity) {
      const newPage = this.state.communityTopicsPage + 1;
      this.setState({
        communityTopicsPage: newPage,
        communityTopicsLoading: true,
      });
      this._fetchCommunityHotTopics(this.state.activeCommunity.featured_link, {
        append: true,
        page: newPage,
      });
    }
  }

  doSearch(term, opts = {}) {
    const defaultSearch = '#locale-en';
    const searchTerm = term === '' ? defaultSearch : term;
    const order = term.startsWith('order:') ? '' : 'order:featured';
    const searchString = `#discover ${searchTerm} ${order}`;
    const q = `${this.baseUrl}${encodeURIComponent(searchString)}&page=${
      opts.pageNumber || 1
    }`;

    fetch(q)
      .then(res => res.json())
      .then(json => {
        if (json.topics) {
          this.setState({
            results: opts.append
              ? this.state.results.concat(json.topics)
              : json.topics,
            loading: false,
            hasMoreResults:
              this.state.page < this.maxPageNumber &&
              json.grouped_search_result?.more_full_page_results,
          });
        } else {
          if (opts.pageNumber > 1) {
            return;
          }

          this.setState({ results: [], loading: false, hasMoreResults: false });
          Site.fromTerm(term)
            .then(site => {
              if (site) {
                this.setState({
                  results: [
                    {
                      ...site,
                      featured_link: site.url,
                      excerpt: site.description,
                      discover_entry_logo_url: site.icon,
                    },
                  ],
                });
              }
            })
            .catch(e => {
              console.log(e);
            })
            .finally(() => {
              this.setState({ loading: false });
            });
        }
      })
      .catch(e => {
        console.log(e);
      });
  }

  addSite(term, opts = {}) {
    if (term.length === 0) {
      return new Promise((resolve, reject) => reject());
    }

    return new Promise((resolve, reject) => {
      Site.fromTerm(term)
        .then(site => {
          if (site) {
            if (this._siteManager.exists(site)) {
              throw 'dupe site';
            }
            this._siteManager.add(site);
            this.setState({ selectionCount: this.state.selectionCount + 1 });
          }

          if (opts.switchTabs) {
            this.props.screenProps.openUrl(site.url);
          }
          this.showToastPrompt();
          resolve(site);
        })
        .catch(e => {
          console.log(e);

          if (e === 'dupe site') {
            Alert.alert(i18n.t('term_exists', { term }));
          } else if (e === 'bad api') {
            Alert.alert(i18n.t('incorrect_url', { term }));
          } else {
            Alert.alert(i18n.t('not_found', { term }));
          }

          reject('failure');
        });
    });
  }

  removeSite(url) {
    const site = this._siteManager.sites.find(s => s.url === url);
    if (site) {
      this._siteManager.remove(site);
      this.setState({ selectionCount: this.state.selectionCount + 1 });
    }
  }

  async showToastPrompt() {
    let granted = true;
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }
    this.showPNToast({ granted });
  }

  showPNToast(opts = {}) {
    Toast.show({
      type: 'success',
      text1: i18n.t('site_added'),
      text2: opts.granted ? null : i18n.t('enable_notifications'),
      position: 'bottom',
      visibilityTime: 6000,
      bottomOffset: 90,
    });
  }

  // ── Navigation ──

  _navigateBack() {
    if (this.state.view === VIEWS.COMMUNITY_DETAIL) {
      if (this.state.previousView === VIEWS.TAG_DETAIL) {
        this.setState({
          view: VIEWS.TAG_DETAIL,
          activeCommunity: null,
          communityTopics: [],
        });
      } else if (this.state.previousView === VIEWS.ALL_COMMUNITIES) {
        this.setState({
          view: VIEWS.ALL_COMMUNITIES,
          activeCommunity: null,
          communityTopics: [],
        });
      } else {
        this._navigateToSplash();
      }
    } else if (this.state.view === VIEWS.ALL_COMMUNITIES) {
      if (this.state.previousView === VIEWS.TAG_DETAIL) {
        this.setState({ view: VIEWS.TAG_DETAIL });
      } else {
        this._navigateToSplash();
      }
    } else if (this.state.view === VIEWS.TAG_DETAIL) {
      this._navigateToSplash();
    } else if (this.state.view === VIEWS.SEARCH) {
      this.setState({ view: VIEWS.SPLASH, term: '', results: [] });
    }
  }

  _navigateToSplash() {
    this.setState({
      view: VIEWS.SPLASH,
      activeTag: null,
      hotTopics: [],
      tagCommunities: [],
      activeCommunity: null,
      communityTopics: [],
      term: '',
      results: [],
    });
  }

  _goToAllCommunities() {
    this.setState({
      view: VIEWS.ALL_COMMUNITIES,
      previousView: VIEWS.TAG_DETAIL,
    });
  }

  // ── Render ──

  render() {
    const theme = this.context;

    return (
      <BottomTabBarHeightContext.Consumer>
        {tabBarHeight => (
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            {this._renderContent(tabBarHeight)}
            <Toast config={toastConfig} />
          </SafeAreaView>
        )}
      </BottomTabBarHeightContext.Consumer>
    );
  }

  _renderContent(tabBarHeight) {
    switch (this.state.view) {
      case VIEWS.SPLASH:
        return this._renderSplashView(tabBarHeight);
      case VIEWS.SEARCH:
        return this._renderSearchView(tabBarHeight);
      case VIEWS.TAG_DETAIL:
        return this._renderTagDetailView(tabBarHeight);
      case VIEWS.ALL_COMMUNITIES:
        return this._renderAllCommunitiesView(tabBarHeight);
      case VIEWS.COMMUNITY_DETAIL:
        return this._renderCommunityDetailView(tabBarHeight);
      default:
        return this._renderSplashView(tabBarHeight);
    }
  }

  _renderSplashView() {
    return (
      <View style={styles.container}>
        {this._renderSearchBox()}
        <DiscoverComponents.TagSplash
          tags={this.state.splashTags}
          loading={this.state.splashTagsLoading}
          onSelectTag={tag => this.onSelectTag(tag)}
        />
      </View>
    );
  }

  _renderSearchView(tabBarHeight) {
    const theme = this.context;
    const messageText =
      this.state.term.length === 1
        ? i18n.t('discover_no_results_one_character')
        : i18n.t('discover_no_results');

    const emptyResult = (
      <ScrollView keyboardShouldPersistTaps="handled">
        {this.state.loading ? (
          <View style={styles.emptyResult}>
            <ActivityIndicator size="large" color={theme.grayUI} />
          </View>
        ) : (
          <View>
            <Text style={{ ...styles.desc, color: theme.grayTitle }}>
              {messageText}
            </Text>
            <TouchableHighlight
              style={styles.noResultsReset}
              underlayColor={theme.background}
              onPress={() => {
                this.setState({
                  view: VIEWS.SPLASH,
                  term: '',
                  page: 1,
                  results: [],
                });
              }}
            >
              <Text
                style={{
                  color: theme.blueUnread,
                  fontSize: 16,
                }}
              >
                {i18n.t('discover_reset')}
              </Text>
            </TouchableHighlight>
          </View>
        )}
      </ScrollView>
    );

    return (
      <View style={styles.container}>
        {this._renderSearchBox()}
        <FlatList
          keyboardDismissMode="on-drag"
          keyExtractor={item => String(item.id || item.featured_link)}
          ListEmptyComponent={emptyResult}
          ref={ref => (this.discoverList = ref)}
          contentContainerStyle={{ paddingBottom: tabBarHeight }}
          data={this.state.results}
          refreshing={this.state.loading}
          refreshControl={
            <RefreshControl
              refreshing={this.state.loading}
              onRefresh={() => {
                if (this.state.term) {
                  this.setState({ loading: true });
                  this.debouncedSearch(this.state.term);
                }
              }}
            />
          }
          renderItem={({ item }) => this._renderSiteItem({ item })}
          onEndReached={() => this._fetchNextSearchPage()}
          extraData={this.state.selectionCount}
          maxToRenderPerBatch={20}
        />
      </View>
    );
  }

  _renderTagDetailView(tabBarHeight) {
    const theme = this.context;
    const tagLabel = this._formatTagLabel(this.state.activeTag);

    const headerComponent = (
      <View>
        <Text style={[styles.sectionLabel, { color: theme.graySubtitle }]}>
          {i18n.t('discover_communities_section')}
        </Text>
        <DiscoverComponents.CommunityCarousel
          communities={this.state.tagCommunities}
          loading={this.state.tagCommunitiesLoading}
          onPressCommunity={community => this.onPressCommunity(community)}
        />
        <TouchableHighlight
          style={[
            styles.seeAllButton,
            { backgroundColor: theme.blueCallToAction },
          ]}
          underlayColor={theme.blueUnread}
          onPress={() => this._goToAllCommunities()}
        >
          <Text
            style={[styles.seeAllButtonText, { color: theme.buttonTextColor }]}
          >
            {i18n.t('discover_see_all_communities')} ›
          </Text>
        </TouchableHighlight>
        <Text style={[styles.sectionLabel, { color: theme.graySubtitle }]}>
          {i18n.t('discover_topics_section')}
        </Text>
      </View>
    );

    return (
      <View style={styles.container}>
        <DiscoverComponents.TagDetailHeader
          title={tagLabel}
          onBack={() => this._navigateBack()}
        />
        <DiscoverComponents.DiscoverTopicList
          topics={this.state.hotTopics}
          loading={this.state.hotTopicsLoading}
          onClickTopic={url => this.props.screenProps.openUrl(url)}
          largerUI={this.state.largerUI}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
          listRef={ref => (this.hotTopicsList = ref)}
          ListHeaderComponent={headerComponent}
          onEndReached={() => this._fetchNextHotTopicsPage()}
          onRefresh={() => {
            this.setState({ hotTopicsLoading: true, hotTopicsPage: 1 });
            this.fetchHotTopics(this.state.activeTag);
          }}
          onExploreMore={() => this._navigateToSplash()}
        />
      </View>
    );
  }

  _renderAllCommunitiesView(tabBarHeight) {
    const theme = this.context;
    const tagLabel = this._formatTagLabel(this.state.activeTag);
    const title = `${tagLabel} ${i18n.t('discover_communities')}`;

    const emptyComponent = this.state.tagCommunitiesLoading ? (
      <View style={styles.emptyResult}>
        <ActivityIndicator size="large" color={theme.grayUI} />
      </View>
    ) : null;

    return (
      <View style={styles.container}>
        <DiscoverComponents.TagDetailHeader
          title={title}
          onBack={() => this._navigateBack()}
        />
        <FlatList
          keyExtractor={item => String(item.id || item.featured_link)}
          ListEmptyComponent={emptyComponent}
          contentContainerStyle={{ paddingBottom: tabBarHeight }}
          data={this.state.tagCommunities}
          renderItem={({ item }) => this._renderSiteItem({ item })}
          extraData={this.state.selectionCount}
          keyboardDismissMode="on-drag"
        />
      </View>
    );
  }

  _renderCommunityDetailView(tabBarHeight) {
    const community = this.state.activeCommunity;
    if (!community) {
      return null;
    }

    const headerComponent = (
      <DiscoverComponents.CommunityDetailView
        community={community}
        activeTag={this.state.activeTag}
        inLocalList={this._siteManager.exists({
          url: community.featured_link,
        })}
        onAddToSidebar={url => this.addSite(url)}
        onRemoveFromSidebar={url => this.removeSite(url)}
        onPreview={url => this.props.screenProps.openUrl(url)}
      />
    );

    return (
      <View style={styles.container}>
        <DiscoverComponents.TagDetailHeader
          title={community.title}
          onBack={() => this._navigateBack()}
        />
        <DiscoverComponents.DiscoverTopicList
          topics={this.state.communityTopics}
          loading={this.state.communityTopicsLoading}
          onClickTopic={url => this.props.screenProps.openUrl(url)}
          largerUI={this.state.largerUI}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
          ListHeaderComponent={headerComponent}
          onEndReached={() => this._fetchNextCommunityTopicsPage()}
          onRefresh={() => {
            this.setState({
              communityTopicsLoading: true,
              communityTopicsPage: 1,
            });
            this._fetchCommunityHotTopics(community.featured_link);
          }}
          onExploreMore={() => this._navigateToSplash()}
        />
      </View>
    );
  }

  // ── Shared Render Helpers ──

  _renderSearchBox() {
    return (
      <DiscoverComponents.TermBar
        text={this.state.term}
        handleChangeText={term => {
          if (term.length > 0) {
            this.setState({ term, loading: true, view: VIEWS.SEARCH });
            this.debouncedSearch(term);
          } else {
            this.setState({
              term: '',
              view: VIEWS.SPLASH,
              results: [],
              loading: false,
              page: 1,
            });
          }
        }}
      />
    );
  }

  _renderSiteItem({ item }) {
    return (
      <DiscoverComponents.SiteRow
        site={item}
        handleSiteAdd={term => this.addSite(term)}
        loadSite={url => this.props.screenProps.openUrl(url)}
        inLocalList={this._siteManager.exists({ url: item.featured_link })}
      />
    );
  }

  _formatTagLabel(tag) {
    if (!tag) {
      return '';
    }
    return tag
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // ── Pagination ──

  _fetchNextSearchPage() {
    if (this.state.hasMoreResults) {
      const newPageNumber = this.state.page + 1;
      this.setState({ page: newPageNumber, loading: true });
      this.doSearch(this.state.term || '', {
        append: true,
        pageNumber: newPageNumber,
      });
    }
  }

  _fetchNextHotTopicsPage() {
    if (this.state.hotTopicsHasMore) {
      const newPage = this.state.hotTopicsPage + 1;
      this.setState({ hotTopicsPage: newPage, hotTopicsLoading: true });
      this.fetchHotTopics(this.state.activeTag, {
        append: true,
        pageNumber: newPage,
      });
    }
  }
}

DiscoverScreen.contextType = ThemeContext;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyResult: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 120,
  },
  desc: {
    fontSize: 16,
    padding: 24,
    textAlign: 'center',
  },
  noResultsReset: {
    padding: 6,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  seeAllButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  seeAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DiscoverScreen;
