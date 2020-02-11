/* @flow */
'use strict';

import React from 'react';

import {
  Alert,
  Animated,
  Easing,
  Linking,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';

import SortableListView from 'react-native-sortable-listview';
import SafariWebAuth from 'react-native-safari-web-auth';
import AsyncStorage from '@react-native-community/async-storage';

import Site from '../site';
import Components from './HomeScreenComponents';

import {ThemeContext} from '../ThemeContext';

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

class HomeScreen extends React.Component {
  constructor(props) {
    super(props);

    this._siteManager = this.props.screenProps.siteManager;

    this.state = {
      addSiteProgress: 0,
      displayTermBar: false,
      anim: new Animated.Value(0),
      data: false,
      isRefreshing: false,
      lastRefreshTime: null,
      scrollEnabled: true,
      refreshingEnabled: true,
      loadingSites: this._siteManager.isLoading(),
    };

    this._onChangeSites = e => this.onChangeSites(e);
  }

  visitSite(site) {
    this._siteManager.setActiveSite(site);

    if (site.authToken) {
      if (site.oneTimePassword) {
        this.props.screenProps.openUrl(
          `${site.url}/session/otp/${site.oneTimePassword}`,
        );
      } else {
        if (this._siteManager.supportsDelegatedAuth(site)) {
          this._siteManager.generateURLParams(site).then(params => {
            this.props.screenProps.openUrl(`${site.url}?${params}`);
          });
        } else {
          this.props.screenProps.openUrl(`${site.url}?discourse_app=1`, false);
        }
      }
      return;
    }

    this._siteManager.generateAuthURL(site).then(url => {
      if (this._siteManager.supportsDelegatedAuth(site)) {
        SafariWebAuth.requestAuth(url);
      } else {
        this.props.screenProps.openUrl(url, false);
      }
    });
  }

  componentDidMount() {
    this._siteManager.subscribe(this._onChangeSites);
    this._onChangeSites();
  }

  componentWillUnmount() {
    this._siteManager.unsubscribe(this._onChangeSites);
  }

  onChangeSites(e) {
    if (this._siteManager.isLoading() !== this.state.loadingSites) {
      this.setState({loadingSites: this._siteManager.isLoading()});
    }
    if (e && e.event) {
      this.setState({data: this._siteManager.toObject()});
    }
  }

  doSearch(term) {
    if (term.length === 0) {
      return new Promise((resolve, reject) => reject());
    }

    this.setState({addSiteProgress: Math.random() * 0.4});

    return new Promise((resolve, reject) => {
      Site.fromTerm(term)
        .then(site => {
          this.setState(
            {
              displayTermBar: false,
              addSiteProgress: 1,
            },
            () => {
              this.onToggleTermBar(this.state.displayTermBar);
            },
          );

          if (site) {
            if (this._siteManager.exists(site)) {
              throw 'dupe site';
            }
            this._siteManager.add(site);
          }

          resolve(site);
        })
        .catch(e => {
          console.log(e);

          if (e === 'dupe site') {
            Alert.alert(`${term} already exists`);
          } else if (e === 'bad api') {
            Alert.alert(
              `Sorry, ${term} is not a correct URL to a Discourse forum or does not support mobile APIs, have owner upgrade Discourse to latest!`,
            );
          } else {
            Alert.alert(`${term} was not found!`);
          }

          this.setState({displayTermBar: true, addSiteProgress: 1});

          reject('failure');
        })
        .finally(() => {
          setTimeout(() => {
            this.setState({addSiteProgress: 0});
          }, 1000);
        })
        .done();
    });
  }

  pullDownToRefresh() {
    this.setState({isRefreshing: true});

    this._siteManager
      .refreshSites()
      .catch(e => {
        console.log(e);
      })
      .done(() => {
        this.setState({isRefreshing: false});
      });
  }

  shouldDisplayOnBoarding() {
    return (
      this._siteManager.sites.length === 0 &&
      !this.refreshing &&
      !this.state.isRefreshing &&
      this.state.addSiteProgress === 0 &&
      !this.state.displayTermBar
    );
  }

  _renderDebugRow() {
    if (this._siteManager.sites.length !== 0) {
      return (
        <Components.DebugRow
          siteManager={this._siteManager}
          toggleTheme={this.props.screenProps.toggleTheme}
        />
      );
    }
  }

  _renderSites() {
    const theme = this.context;
    if (this.state.loadingSites) {
      return <View style={{flex: 1}} />;
    }

    if (this.shouldDisplayOnBoarding()) {
      return (
        <Components.OnBoardingView
          onDidPressAddSite={() =>
            this.setState({displayTermBar: true}, () => {
              this.onToggleTermBar(this.state.displayTermBar);
            })
          }
          onDidPressSuggestedSite={site => {
            if (!this._siteManager.exists(site)) {
              this._siteManager.add(site);
            }
          }}
        />
      );
    } else {
      return (
        <SortableListView
          data={this.state.data}
          order={Object.keys(this.state.data)}
          scrollEnabled={this.state.scrollEnabled}
          enableEmptySections={true}
          activeOpacity={0.5}
          disableAnimatedScrolling={true}
          styles={styles.list}
          rowHasChanged={(r1, r2) => {
            // TODO: r2 returns as an Object instead of a Site
            // casting Site shouldn't be needed
            return new Site(r1).toJSON() !== new Site(r2).toJSON();
          }}
          onRowMoved={e => {
            this._siteManager.updateOrder(e.from, e.to);
            this.forceUpdate();
          }}
          onRowActive={() => {
            this.setState({refreshingEnabled: false});
          }}
          onMoveEnd={() => {
            this.setState({refreshingEnabled: true});
          }}
          onMoveCancel={() => {
            this.setState({refreshingEnabled: true});
          }}
          refreshControl={
            <RefreshControl
              style={{left: 500}}
              enabled={this.state.refreshingEnabled}
              refreshing={this.state.isRefreshing}
              onRefresh={() => this.pullDownToRefresh()}
              title="Loading..."
              titleColor={theme.graySubtitle}
            />
          }
          renderRow={site => (
            <Components.SiteRow
              site={site}
              onSwipe={scrollEnabled =>
                this.setState({scrollEnabled: scrollEnabled})
              }
              onClick={() => this.visitSite(site)}
              onDelete={() => this._siteManager.remove(site)}
            />
          )}
        />
      );
    }
  }

  onToggleTermBar(show) {
    Animated.timing(this.state.anim, {
      easing: Easing.inOut(Easing.ease),
      duration: 200,
      toValue: show ? 1 : 0,
      useNativeDriver: true,
    }).start(() => {
      if (this._input) {
        show ? this._input.focus() : this._input.blur();
      }
    });
  }

  onDidPressLeftButton() {
    this.setState({displayTermBar: !this.state.displayTermBar}, () => {
      this.onToggleTermBar(this.state.displayTermBar);
    });
  }

  onDidPressRighButton() {
    this.props.navigation.navigate('Notifications');
  }

  render() {
    const theme = this.context;
    const translateY = this.state.anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Components.TermBar.Height],
    });
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: theme.background}]}
        forceInset={{top: 'never', bottom: 'always'}}>
        <Components.NavigationBar
          leftButtonIconRotated={this.state.displayTermBar ? true : false}
          anim={this.state.anim}
          rightButtonIconColor={theme.grayUI}
          onDidPressLeftButton={() => this.onDidPressLeftButton()}
          onDidPressRightButton={() => this.onDidPressRighButton()}
          progress={this.state.addSiteProgress}
        />
        <Components.TermBar
          anim={this.state.anim}
          getInputRef={ref => (this._input = ref)}
          onDidSubmitTerm={term => this.doSearch(term)}
        />
        <Animated.View
          style={[styles.sitesContainer, {transform: [{translateY}]}]}>
          {this._renderSites()}
          {this._renderDebugRow()}
        </Animated.View>
      </SafeAreaView>
    );
  }
}
HomeScreen.contextType = ThemeContext;

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  sitesContainer: {
    flex: 1,
    marginTop: -Components.TermBar.Height,
  },
});

export default HomeScreen;
