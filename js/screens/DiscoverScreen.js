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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import DiscoverComponents from './DiscoverScreenComponents';
import {ThemeContext} from '../ThemeContext';
import Site from '../site';
import i18n from 'i18n-js';
import fetch from './../../lib/fetch';
import {debounce} from 'lodash';
import Toast, {BaseToast} from 'react-native-toast-message';
import {BottomTabBarHeightContext} from '@react-navigation/bottom-tabs';

const toastConfig = {
  success: props => (
    <BaseToast
      {...props}
      style={{borderLeftColor: 'transparent'}}
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
      contentContainerStyle={{paddingHorizontal: 10}}
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
    };

    this._siteManager = this.props.screenProps.siteManager;
    this.baseUrl = `${Site.discoverUrl()}/search.json?q=`;
    this.maxPageNumber = 10;

    this.debouncedSearch = debounce(this.doSearch, 750);

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

          this.setState({results: [], loading: false, hasMoreResults: false});
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
              this.setState({loading: false});
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
            this.setState({selectionCount: this.state.selectionCount + 1});
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
            Alert.alert(i18n.t('term_exists', {term}));
          } else if (e === 'bad api') {
            Alert.alert(i18n.t('incorrect_url', {term}));
          } else {
            Alert.alert(i18n.t('not_found', {term}));
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
    this.showPNToast({granted});
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
    const resultCount = this.state.results.length;
    const messageText = i18n.t('discover_no_results');

    const emptyResult = (
      <ScrollView keyboardShouldPersistTaps="handled">
        {this.state.term === '' ? (
          <ActivityIndicator size="large" color={theme.grayUI} />
        ) : (
          <View>
            <Text style={{...styles.desc, color: theme.grayTitle}}>
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
              }}>
              <Text
                style={{
                  color: theme.blueUnread,
                  fontSize: 16,
                }}>
                {i18n.t('discover_reset')}
              </Text>
            </TouchableHighlight>
          </View>
        )}
      </ScrollView>
    );

    return (
      <BottomTabBarHeightContext.Consumer>
        {tabBarHeight => (
          <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
            {this._renderSearchBox()}
            {resultCount > 0 ? this._renderTags() : null}
            <View style={styles.container}>
              <FlatList
                keyboardDismissMode="on-drag"
                ListEmptyComponent={emptyResult}
                ref={ref => (this.discoverList = ref)}
                contentContainerStyle={{paddingBottom: tabBarHeight}}
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
                renderItem={({item}) => this._renderItem({item})}
                onEndReached={() => {
                  this._fetchNextPage();
                }}
                extraData={this.state.selectionCount}
                maxToRenderPerBatch={20}
              />
            </View>
            <Toast config={toastConfig} />
          </SafeAreaView>
        )}
      </BottomTabBarHeightContext.Consumer>
    );
  }

  _fetchNextPage() {
    if (this.state.hasMoreResults) {
      const newPageNumber = this.state.page + 1;

      this.setState({page: newPageNumber, loading: true});
      this.doSearch(this.state.selectedTag || '', {
        append: true,
        pageNumber: newPageNumber,
      });
    }
  }

  _renderSearchBox() {
    return (
      <DiscoverComponents.TermBar
        text={this.state.term}
        handleChangeText={term => {
          this.setState({term, loading: true, selectedTag: false});
          this.debouncedSearch(term);
        }}
      />
    );
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
        style={styles.tags}>
        {this._renderTag(i18n.t('discover_all'), '')}
        {this._renderTag(i18n.t('discover_tech'), '#technology')}
        {this._renderTag(i18n.t('discover_interests'), '#interests')}
        {this._renderTag(i18n.t('discover_support'), '#support')}
        {this._renderTag(i18n.t('discover_media'), '#media')}
        {this._renderTag(i18n.t('discover_gaming'), '#gaming')}
        {this._renderTag(i18n.t('discover_open_source'), '#open-source')}
        {this._renderTag(i18n.t('discover_international'), '#locale-intl')}
        {this._renderTag(i18n.t('discover_recent'), 'order:latest_topic')}
        <View style={{width: 24}} />
      </ScrollView>
    );
  }

  _renderTag(label, searchString) {
    const theme = this.context;
    const isCurrentTerm = searchString === this.state.selectedTag;

    return (
      <TouchableHighlight
        style={{
          ...styles.tag,
          borderColor: theme.grayUILight,
          backgroundColor: isCurrentTerm
            ? theme.grayBackground
            : theme.background,
        }}
        underlayColor={theme.grayBackground}
        onPress={() => {
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
        }}>
        <Text
          style={{
            color: theme.tagButtonTextColor,
            fontSize: this.state.largerUI ? 15 : 13,
          }}>
          {label}
        </Text>
      </TouchableHighlight>
    );
  }

  _renderItem({item}) {
    return (
      <DiscoverComponents.SiteRow
        site={item}
        handleSiteAdd={term => this.addSite(term)}
        loadSite={url => this.props.screenProps.openUrl(url)}
        inLocalList={this._siteManager.exists({url: item.featured_link})}
      />
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
