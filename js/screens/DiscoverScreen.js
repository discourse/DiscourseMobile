/* @flow */
'use strict';

import React from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Common from './CommonComponents';
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
          // We can't call PushNotificationIOS.requestPermissions again
          // per https://developer.apple.com/documentation/usernotifications/asking_permission_to_use_notifications?language=objc
          // only the first authorization request is honored
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

class DiscoverScreen extends React.Component {
  constructor(props) {
    super(props);

    this.defaultSearch = '#locale-en';

    this.state = {
      loading: true,
      page: 1,
      results: [],
      selectionCount: 0,
      term: '',
      selectedTag: '',
      hasMoreResults: false,
      progress: 0.5,
      largerUI: props.screenProps.largerUI,
      showHotTopics: false,
      selectedViewIndex: 0,
      hotTopics: [],
      hotTopicsLoading: true,
      hotTopicsSelectedTag: 'ai',
      hotTopicsPage: 1,
      hotTopicsHasMore: false,
      hotTopicsTagChosen: false,
    };

    this._siteManager = this.props.screenProps.siteManager;
    this.baseUrl = `${Site.discoverUrl()}search.json?q=`;
    this.maxPageNumber = 10;

    this.debouncedSearch = debounce(this.doSearch, 750);

    this.hotTopicTags = [
      { label: i18n.t('discover_tag_ai'), value: 'ai' },
      { label: i18n.t('discover_tag_finance'), value: 'finance' },
      { label: i18n.t('discover_tag_apple'), value: 'apple' },
      { label: i18n.t('discover_tag_automation'), value: 'automation' },
      { label: i18n.t('discover_tag_media'), value: 'media' },
      { label: i18n.t('discover_tag_research'), value: 'research' },
      { label: i18n.t('discover_tag_smart_home'), value: 'smart-home' },
      { label: i18n.t('discover_tag_linux'), value: 'linux' },
      { label: i18n.t('discover_tag_open_source'), value: 'open-source' },
      { label: i18n.t('discover_tag_webdev'), value: 'webdev' },
      { label: i18n.t('discover_tag_health'), value: 'health' },
      { label: i18n.t('discover_tag_gaming'), value: 'gaming' },
      { label: i18n.t('discover_tag_audio'), value: 'audio' },
      {
        label: i18n.t('discover_tag_programming_language'),
        value: 'programming-language',
      },
      { label: i18n.t('discover_tag_devops'), value: 'devops' },
      { label: i18n.t('discover_tag_crypto'), value: 'crypto' },
      { label: i18n.t('discover_tag_mapping'), value: 'mapping' },
    ];

    this.doSearch('');
  }

  doSearch(term, opts = {}) {
    const searchTerm = term === '' ? this.defaultSearch : term;
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
            // Skip early if page number filter is somehow returning no results
            // otherwise, this can cause a reset when scrolling
            // TODO: handle this situation a little better maybe?
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

  componentDidMount() {
    this._unsubscribeTabPress = this.props.navigation.addListener(
      'tabPress',
      () => {
        if (this.state.showHotTopics && this.state.hotTopicsTagChosen) {
          this.setState({ hotTopicsTagChosen: false, hotTopics: [] });
        }
      },
    );
  }

  componentWillUnmount() {
    if (this._unsubscribeTabPress) {
      this._unsubscribeTabPress();
    }
  }

  _onSelectTag(tagValue) {
    this.setState({
      hotTopicsTagChosen: true,
      hotTopicsSelectedTag: tagValue,
      hotTopicsLoading: true,
      hotTopicsPage: 1,
    });
    this.fetchHotTopics(tagValue);
  }

  fetchHotTopics(tag, opts = {}) {
    const page = opts.pageNumber || 1;
    const url = `${Site.discoverUrl()}discover/hot-topics.json?tag=${encodeURIComponent(
      tag,
    )}&page=${page}`;

    fetch(url)
      .then(res => res.json())
      .then(json => {
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
            // TODO: use "Connect here?"
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

  async showToastPrompt() {
    let granted = true;
    // Android 33+ has a permission request prompt
    // versions before that permissions is always granted
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

  render() {
    const theme = this.context;

    return (
      <BottomTabBarHeightContext.Consumer>
        {tabBarHeight => (
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            {this._renderHeader()}
            {this._renderViewToggle()}
            {this._renderSubHeader()}
            {this._renderContent(tabBarHeight)}
            <Toast config={toastConfig} />
          </SafeAreaView>
        )}
      </BottomTabBarHeightContext.Consumer>
    );
  }

  _renderHeader() {
    if (this.state.showHotTopics) {
      return <DiscoverComponents.NavigationBar />;
    }
    return (
      <DiscoverComponents.TermBar
        text={this.state.term}
        handleChangeText={term => {
          this.setState({ term, loading: true, selectedTag: false });
          this.debouncedSearch(term);
        }}
      />
    );
  }

  _renderViewToggle() {
    const theme = this.context;
    return (
      <View
        style={{
          flex: 0,
          backgroundColor: theme.background,
          borderBottomColor: theme.grayBorder,
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      >
        <Common.Filter
          selectedIndex={this.state.selectedViewIndex}
          tabs={[i18n.t('discover_communities'), i18n.t('discover_hot_topics')]}
          marginHorizontal={'15%'}
          onChange={index => {
            const showHotTopics = Boolean(index);
            if (showHotTopics && this.state.showHotTopics) {
              this.setState({ hotTopicsTagChosen: false });
              return;
            }
            this.setState({
              showHotTopics,
              selectedViewIndex: index,
            });
          }}
        />
      </View>
    );
  }

  _renderSubHeader() {
    if (this.state.showHotTopics) {
      return this.state.hotTopicsTagChosen
        ? this._renderHotTopicsHeader()
        : null;
    }
    return this.state.results.length > 0 ? this._renderTags() : null;
  }

  _renderTags() {
    const tagOptions = [
      '',
      this.defaultSearch,
      '#technology',
      '#interests',
      '#support',
      '#media',
      '#gaming',
      '#open-source',
      '#ai',
      '#locale-intl',
      'order:latest_topic',
    ];

    if (!tagOptions.includes(this.state.term)) {
      return null;
    }

    return (
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.tags}
      >
        {this._renderTag(i18n.t('discover_all'), '')}
        {this._renderTag(i18n.t('discover_tech'), '#technology')}
        {this._renderTag(i18n.t('discover_interests'), '#interests')}
        {this._renderTag(i18n.t('discover_support'), '#support')}
        {this._renderTag(i18n.t('discover_media'), '#media')}
        {this._renderTag(i18n.t('discover_gaming'), '#gaming')}
        {this._renderTag(i18n.t('discover_open_source'), '#open-source')}
        {this._renderTag(i18n.t('discover_ai'), '#ai')}
        {this._renderTag(i18n.t('discover_international'), '#locale-intl')}
        {this._renderTag(i18n.t('discover_recent'), 'order:latest_topic')}
        <View style={{ width: 24 }} />
      </ScrollView>
    );
  }

  _renderTagPill(key, label, isActive, onPress) {
    const theme = this.context;

    return (
      <TouchableHighlight
        key={key}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          ...styles.tag,
          borderColor: theme.grayUILight,
          backgroundColor: isActive
            ? theme.grayBackground
            : theme.background,
        }}
        underlayColor={theme.grayBackground}
        onPress={onPress}
      >
        <Text
          style={{
            color: theme.tagButtonTextColor,
            fontSize: this.state.largerUI ? 15 : 13,
          }}
        >
          {label}
        </Text>
      </TouchableHighlight>
    );
  }

  _renderTag(label, searchString) {
    const isCurrentTerm = searchString === this.state.selectedTag;

    return this._renderTagPill(searchString, label, isCurrentTerm, () => {
      this.setState({
        selectedTag: searchString,
        loading: true,
        page: 1,
      });
      if (this.discoverList) {
        this.discoverList.scrollToIndex({
          index: 0,
          animated: true,
        });
      }
      this.doSearch(searchString);
    });
  }

  _renderContent(tabBarHeight) {
    if (this.state.showHotTopics) {
      return this._renderHotTopicsContent(tabBarHeight);
    }
    return this._renderDiscoverList(tabBarHeight);
  }

  _renderHotTopicsContent(tabBarHeight) {
    if (!this.state.hotTopicsTagChosen) {
      return (
        <DiscoverComponents.TagSplash
          tags={this.hotTopicTags}
          onSelectTag={tag => this._onSelectTag(tag)}
        />
      );
    }

    return (
      <View style={styles.container}>
        <DiscoverComponents.DiscoverTopicList
          topics={this.state.hotTopics}
          loading={this.state.hotTopicsLoading}
          onClickTopic={url => this.props.screenProps.openUrl(url)}
          largerUI={this.state.largerUI}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
          listRef={ref => (this.hotTopicsList = ref)}
          onEndReached={() => this._fetchNextHotTopicsPage()}
          onRefresh={() => {
            this.setState({
              hotTopicsLoading: true,
              hotTopicsPage: 1,
            });
            this.fetchHotTopics(this.state.hotTopicsSelectedTag);
          }}
          onExploreMore={() => this.setState({ hotTopicsTagChosen: false })}
        />
      </View>
    );
  }

  _renderDiscoverList(tabBarHeight) {
    return (
      <View style={styles.container}>
        <FlatList
          keyboardDismissMode="on-drag"
          keyExtractor={item => String(item.id || item.featured_link)}
          ListEmptyComponent={() => this._renderEmptyResult()}
          ref={ref => (this.discoverList = ref)}
          contentContainerStyle={{ paddingBottom: tabBarHeight }}
          data={this.state.results}
          refreshing={this.state.loading}
          refreshControl={
            <RefreshControl
              refreshing={this.state.loading}
              onRefresh={() => {
                // ensures we don't refresh for keyword searches
                if (this.state.selectedTag !== false) {
                  this.debouncedSearch(this.state.selectedTag);
                }
              }}
            />
          }
          renderItem={({ item }) => this._renderItem({ item })}
          onEndReached={() => {
            this._fetchNextPage();
          }}
          extraData={this.state.selectionCount}
          maxToRenderPerBatch={20}
        />
      </View>
    );
  }

  _renderItem({ item }) {
    return (
      <DiscoverComponents.SiteRow
        site={item}
        handleSiteAdd={term => this.addSite(term)}
        loadSite={url => this.props.screenProps.openUrl(url)}
        inLocalList={this._siteManager.exists({ url: item.featured_link })}
      />
    );
  }

  _renderEmptyResult() {
    const theme = this.context;

    if (this.state.term === '') {
      return (
        <View style={styles.emptyResult}>
          <ActivityIndicator size="large" color={theme.grayUI} />
        </View>
      );
    }

    const messageText =
      this.state.term.length === 1
        ? i18n.t('discover_no_results_one_character')
        : i18n.t('discover_no_results');

    return (
      <ScrollView keyboardShouldPersistTaps="handled">
        <View>
          <Text style={{ ...styles.desc, color: theme.grayTitle }}>
            {messageText}
          </Text>
          <TouchableHighlight
            style={styles.noResultsReset}
            underlayColor={theme.background}
            onPress={() => {
              this.setState({
                selectedTag: '',
                term: '',
                page: 1,
              });
              this.doSearch('');
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
      </ScrollView>
    );
  }

  _fetchNextPage() {
    if (this.state.hasMoreResults) {
      const newPageNumber = this.state.page + 1;

      this.setState({ page: newPageNumber, loading: true });
      this.doSearch(this.state.selectedTag || '', {
        append: true,
        pageNumber: newPageNumber,
      });
    }
  }

  _fetchNextHotTopicsPage() {
    if (this.state.hotTopicsHasMore) {
      const newPage = this.state.hotTopicsPage + 1;
      this.setState({ hotTopicsPage: newPage, hotTopicsLoading: true });
      this.fetchHotTopics(this.state.hotTopicsSelectedTag, {
        append: true,
        pageNumber: newPage,
      });
    }
  }

  _renderHotTopicsHeader() {
    return (
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.tags}
      >
        {this.hotTopicTags.map(tag => {
          const isCurrentTag = tag.value === this.state.hotTopicsSelectedTag;

          return this._renderTagPill(tag.value, tag.label, isCurrentTag, () => {
            if (tag.value === this.state.hotTopicsSelectedTag) {
              this.setState({ hotTopicsTagChosen: false });
            } else {
              this._onSelectTag(tag.value);
            }
          });
        })}
        <View style={{ width: 24 }} />
      </ScrollView>
    );
  }
}

DiscoverScreen.contextType = ThemeContext;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    justifyContent: 'center',
    flex: 1,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
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
  tags: {
    paddingLeft: 12,
    paddingBottom: 12,
    width: '100%',
    flexDirection: 'row',
    maxHeight: 50,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    margin: 2,
  },
});

export default DiscoverScreen;
