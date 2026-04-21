/* @flow */
'use strict';

import React from 'react';
import { Alert, BackHandler, PermissionsAndroid, Platform } from 'react-native';

import DiscoverComponents from './DiscoverScreenComponents';
import SplashView from './DiscoverScreenComponents/views/SplashView';
import SearchView from './DiscoverScreenComponents/views/SearchView';
import TagDetailView from './DiscoverScreenComponents/views/TagDetailView';
import AllCommunitiesView from './DiscoverScreenComponents/views/AllCommunitiesView';
import CommunityDetailView from './DiscoverScreenComponents/views/CommunityDetailView';
import {
  VIEWS,
  defaultView,
  FALLBACK_TAGS,
  toastConfig,
} from './DiscoverScreenComponents/constants';
import * as api from './DiscoverScreenComponents/api';
import { ThemeContext } from '../ThemeContext';
import Site from '../site';
import i18n from 'i18n-js';
import { debounce } from 'lodash';
import Toast from 'react-native-toast-message';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

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

      // All communities
      communitiesFilter: null, // null = all, 'recent' = order by latest, otherwise a tag
      allCommunities: [],
      allCommunitiesLoading: false,

      // Community detail
      activeCommunity: null,
      communityTopics: [],
      communityTopicsLoading: true,
      communityTopicsPage: 1,
      communityTopicsHasMore: false,

      largerUI: props.screenProps.largerUI,
    };

    this._siteManager = this.props.screenProps.siteManager;
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
    api
      .fetchSplashTags()
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
    api
      .fetchHotTopics(tag, 1)
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
            communitiesFilter: tag,
            allCommunities: [],
            allCommunitiesLoading: true,
          });
          this._fetchAllCommunities(tag);
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

    api
      .fetchHotTopics(tag, page)
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
    api
      .fetchTagCommunities(tag)
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

    api
      .fetchCommunityHotTopics(communityUrl, page)
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
    api
      .searchDiscover(term, opts.pageNumber || 1)
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
    const filter = this.state.activeTag;
    if (this.state.tagCommunitiesLoading) {
      this.setState({
        view: VIEWS.ALL_COMMUNITIES,
        previousView: VIEWS.TAG_DETAIL,
        communitiesFilter: filter,
        allCommunities: [],
        allCommunitiesLoading: true,
      });
      this._fetchAllCommunities(filter);
    } else {
      this.setState({
        view: VIEWS.ALL_COMMUNITIES,
        previousView: VIEWS.TAG_DETAIL,
        communitiesFilter: filter,
        allCommunities: this.state.tagCommunities,
        allCommunitiesLoading: false,
      });
    }
  }

  _goToAllCommunitiesFromSplash(filter = null) {
    this.setState({
      view: VIEWS.ALL_COMMUNITIES,
      previousView: VIEWS.SPLASH,
      communitiesFilter: filter,
      allCommunities: [],
      allCommunitiesLoading: true,
    });
    this._fetchAllCommunities(filter);
  }

  _selectFromTagDetail(key) {
    if (key === null) {
      this._goToAllCommunitiesFromSplash(null);
    } else if (key === 'recent') {
      this._goToAllCommunitiesFromSplash('recent');
    } else if (key !== this.state.activeTag) {
      this.onSelectTag(key);
    }
  }

  _selectCommunitiesFilter(filter) {
    if (filter === this.state.communitiesFilter) {
      return;
    }
    this.setState({
      communitiesFilter: filter,
      allCommunities: [],
      allCommunitiesLoading: true,
    });
    this._fetchAllCommunities(filter);
  }

  _fetchAllCommunities(filter) {
    api
      .fetchAllCommunities(filter)
      .then(json => {
        if (filter !== this.state.communitiesFilter) {
          return; // stale response
        }
        this.setState({
          allCommunities: json.topics || [],
          allCommunitiesLoading: false,
        });
      })
      .catch(e => {
        console.log(e);
        if (filter !== this.state.communitiesFilter) {
          return;
        }
        this.setState({ allCommunitiesLoading: false });
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
        return this._renderSplashView();
      case VIEWS.SEARCH:
        return this._renderSearchView(tabBarHeight);
      case VIEWS.TAG_DETAIL:
        return this._renderTagDetailView(tabBarHeight);
      case VIEWS.ALL_COMMUNITIES:
        return this._renderAllCommunitiesView(tabBarHeight);
      case VIEWS.COMMUNITY_DETAIL:
        return this._renderCommunityDetailView(tabBarHeight);
      default:
        return this._renderSplashView();
    }
  }

  _renderSplashView() {
    return (
      <SplashView
        splashTags={this.state.splashTags}
        splashTagsLoading={this.state.splashTagsLoading}
        onSelectTag={tag => this.onSelectTag(tag)}
        onSelectRecent={() => this._goToAllCommunitiesFromSplash('recent')}
        onSeeAllCommunities={() => this._goToAllCommunitiesFromSplash()}
        renderSearchBox={() => this._renderSearchBox()}
      />
    );
  }

  _renderSearchView(tabBarHeight) {
    return (
      <SearchView
        term={this.state.term}
        results={this.state.results}
        loading={this.state.loading}
        selectionCount={this.state.selectionCount}
        tabBarHeight={tabBarHeight}
        listRef={ref => (this.discoverList = ref)}
        onResetToSplash={() =>
          this.setState({
            view: VIEWS.SPLASH,
            term: '',
            page: 1,
            results: [],
          })
        }
        onRefresh={() => {
          if (this.state.term) {
            this.setState({ loading: true });
            this.debouncedSearch(this.state.term);
          }
        }}
        onEndReached={() => this._fetchNextSearchPage()}
        renderSearchBox={() => this._renderSearchBox()}
        renderSiteItem={({ item }) => this._renderSiteItem({ item })}
      />
    );
  }

  _renderTagDetailView(tabBarHeight) {
    return (
      <TagDetailView
        activeTag={this.state.activeTag}
        tagCommunities={this.state.tagCommunities}
        tagCommunitiesLoading={this.state.tagCommunitiesLoading}
        hotTopics={this.state.hotTopics}
        hotTopicsLoading={this.state.hotTopicsLoading}
        splashTags={this.state.splashTags}
        largerUI={this.state.largerUI}
        tabBarHeight={tabBarHeight}
        listRef={ref => (this.hotTopicsList = ref)}
        onPressCommunity={community => this.onPressCommunity(community)}
        onSeeAll={() => this._goToAllCommunities()}
        onClickTopic={url => this.props.screenProps.openUrl(url)}
        onEndReached={() => this._fetchNextHotTopicsPage()}
        onRefresh={() => {
          this.setState({ hotTopicsLoading: true, hotTopicsPage: 1 });
          this.fetchHotTopics(this.state.activeTag);
        }}
        onExploreMore={() => this._navigateToSplash()}
        onSelectTag={key => this._selectFromTagDetail(key)}
        renderSearchBox={() => this._renderSearchBox()}
      />
    );
  }

  _renderAllCommunitiesView(tabBarHeight) {
    return (
      <AllCommunitiesView
        allCommunities={this.state.allCommunities}
        allCommunitiesLoading={this.state.allCommunitiesLoading}
        communitiesFilter={this.state.communitiesFilter}
        splashTags={this.state.splashTags}
        largerUI={this.state.largerUI}
        selectionCount={this.state.selectionCount}
        tabBarHeight={tabBarHeight}
        onSelectFilter={key => this._selectCommunitiesFilter(key)}
        renderSearchBox={() => this._renderSearchBox()}
        renderSiteItem={({ item }) => this._renderSiteItem({ item })}
      />
    );
  }

  _renderCommunityDetailView(tabBarHeight) {
    const community = this.state.activeCommunity;
    if (!community) {
      return null;
    }

    return (
      <CommunityDetailView
        community={community}
        activeTag={this.state.activeTag}
        communityTopics={this.state.communityTopics}
        communityTopicsLoading={this.state.communityTopicsLoading}
        inLocalList={this._siteManager.exists({
          url: community.featured_link,
        })}
        largerUI={this.state.largerUI}
        tabBarHeight={tabBarHeight}
        onAddToSidebar={url => this.addSite(url)}
        onRemoveFromSidebar={url => this.removeSite(url)}
        onPreview={url => this.props.screenProps.openUrl(url)}
        onClickTopic={url => this.props.screenProps.openUrl(url)}
        onBack={() => this._navigateBack()}
        onEndReached={() => this._fetchNextCommunityTopicsPage()}
        onRefresh={() => {
          this.setState({
            communityTopicsLoading: true,
            communityTopicsPage: 1,
          });
          this._fetchCommunityHotTopics(community.featured_link);
        }}
        onExploreMore={() => this._navigateToSplash()}
        renderSearchBox={() => this._renderSearchBox()}
      />
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

export default DiscoverScreen;
