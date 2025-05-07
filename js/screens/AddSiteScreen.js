/* @flow */
/* global Request */
'use strict';

import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import DiscoverComponents from './DiscoverScreenComponents';
import {ThemeContext} from '../ThemeContext';
import Site from '../site';
import i18n from 'i18n-js';
import fetch from './../../lib/fetch';
import {debounce} from 'lodash';
import {BottomTabBarHeightContext} from '@react-navigation/bottom-tabs';

class AddSiteScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      results: [],
      term: '',
      loading: false,
    };

    this._siteManager = this.props.screenProps.siteManager;

    this.debouncedSearch = debounce(this.doSearch, 750);
  }

  async doSearch(term) {
    try {
      const site = await Site.fromTerm(term);

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
          loading: false,
        });
      } else {
        if (term.length && !term.includes('.')) {
          this.fallbackDiscoverSearch(term);
        } else {
          this.setState({
            results: [],
            loading: false,
          });
        }
      }
    } catch (error) {
      // console.error(error);
      this.setState({loading: false});
    }
  }

  addSite(term) {
    if (term.length === 0) {
      return new Promise((_resolve, reject) => reject());
    }

    return new Promise((resolve, reject) => {
      Site.fromTerm(term)
        .then(site => {
          if (site) {
            if (this._siteManager.exists(site)) {
              throw 'dupe site';
            }

            this._siteManager.add(site);
            this.props.navigation.navigate('Home');
          }

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

  fallbackDiscoverSearch(term) {
    const searchString = `#discover ${term} order:featured`;
    const q = `${Site.discoverUrl()}/search.json?q=${encodeURIComponent(
      searchString,
    )}`;

    fetch(q)
      .then(res => res.json())
      .then(json => {
        if (json.topics) {
          this.setState({
            results: json.topics,
            loading: false,
          });
        }
      })
      .catch(e => {
        this.setState({loading: false});
        console.log(e);
      });
  }

  render() {
    const theme = this.context;
    const messageText =
      this.state.term !== ''
        ? i18n.t('single_site_no_results')
        : i18n.t('single_site_blank_screen');

    const emptyResult = (
      <ScrollView keyboardShouldPersistTaps="handled">
        {this.state.loading ? (
          <View style={{padding: 20, flex: 1, alignItems: 'center'}}>
            <ActivityIndicator size="large" color={theme.grayUI} />
          </View>
        ) : (
          <Text style={{...styles.desc, color: theme.grayTitle}}>
            {messageText}
          </Text>
        )}
      </ScrollView>
    );

    return (
      <BottomTabBarHeightContext.Consumer>
        {tabBarHeight => (
          <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
            <View style={styles.container}>
              {this._renderSearchBox()}
              <FlatList
                ListEmptyComponent={emptyResult}
                ref={ref => (this.discoverList = ref)}
                contentContainerStyle={{paddingBottom: tabBarHeight}}
                data={this.state.results}
                refreshing={this.state.loading}
                renderItem={({item}) => this._renderItem({item})}
              />
            </View>
          </SafeAreaView>
        )}
      </BottomTabBarHeightContext.Consumer>
    );
  }

  _renderSearchBox() {
    return (
      <DiscoverComponents.TermBar
        text={this.state.term}
        addSiteScreenParent={true}
        handleChangeText={term => {
          this.setState({term, loading: true, selectedTag: false});
          this.debouncedSearch(term);
        }}
      />
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

  _fetchReq(path) {
    return new Promise((resolve, reject) => {
      let req = new Request(path, {
        method: 'GET',
      });
      this._currentFetch = fetch(req);
      this._currentFetch
        .then(r1 => {
          if (r1.status === 200) {
            return r1.json();
          } else {
            throw 'Error during fetch status code:' + r1.status;
          }
        })
        .then(result => {
          resolve(result);
        })
        .catch(e => {
          reject(e);
        })
        .finally(() => {
          this._currentFetch = undefined;
        });
    });
  }
}

AddSiteScreen.contextType = ThemeContext;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 16,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyResult: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingBottom: 120,
  },
  desc: {
    fontSize: 16,
    padding: 32,
    textAlign: 'center',
  },
});

export default AddSiteScreen;
