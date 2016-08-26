/* @flow */
'use strict'

import React, {
  Component,
  PropTypes
} from 'react';

import {
  ListView,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

import Dimensions from 'Dimensions';
import Moment from 'moment';
import { Bar } from 'react-native-progress';

import Site from '../../site';
import HomeSiteRow from './HomeSiteRow';
import HomeHeader from './HomeHeader';

class HomeScreen extends Component {
  static propTypes = {
    onVisitSite: PropTypes.func.isRequired,
    siteManager: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);

    this._dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1.toJSON() !== r2.toJSON()
    });
    this._dataSource = this._dataSource.cloneWithRows(this.props.siteManager.sites);

    this.state = {
      addSiteProgress: 0,
      dataSource: this._dataSource,
      isRefreshing: false,
      lastRefreshTime: null
    }

    this._onChangeSites = (e) => this.onChangeSites(e);
    this.props.siteManager.subscribe(this._onChangeSites);
  }

  componentDidMount() {
    this.refresher = setInterval(()=>{
      this.refreshSites({ui: false, fast: true});
    }, 1000*11);
  }

  componentWillUnmount() {
    this.props.siteManager.unsubscribe(this._onChangeSites);
    clearInterval(this.refresher);
  }

  onChangeSites(e) {

    if (e.event === "change") {
      this._dataSource = this._dataSource.cloneWithRows(this.props.siteManager.sites);
      this.setState({
        dataSource: this._dataSource
      })
    }

    if (e.event === "refresh") {
      this.setState({
        lastRefreshTime: Moment(this.props.siteManager.lastRefresh).format("LT")
      });
    }
  }

  doSearch(term) {
    this.setState({addSiteProgress: Math.random() * 0.4})
    Site.fromTerm(term)
      .then(site => {
        this.setState({addSiteProgress: 1})

        if (site) {
          this.props.siteManager.add(site);
        }

        setTimeout(
          ()=>{ this.setState({addSiteProgress: 0}) },
          250
        );
      });
  }

  refreshSites(opts) {
    if (this.refreshing) { return false; }

    if (opts.ui) {
      this.setState({isRefreshing: true});
    }

    this.props.siteManager.refreshSites(opts)
      .then(()=>{
        this.refreshing = false;

        this.setState({
          isRefreshing: false
        })
    });
  }

  renderSites() {
    if(this.props.siteManager.sites.length == 0 && this.state.lastRefreshTime) {
      return (
        <Text style={{textAlign: 'center', padding: 12}}>
          You don’t have any sites yet.
          Discourse notifier can keep track
          of your notifications across sites.
          Tap `Add` to track your first site.
        </Text>
      )
    } else {
      return (
        <ListView
          dataSource={this.state.dataSource}
          enableEmptySections={true}
          styles={styles.list}
          refreshControl={
            <RefreshControl
              style={{left: 500}}
              refreshing={this.state.isRefreshing}
              onRefresh={()=>this.refreshSites({ui: true, fast: false})}
              title="Loading..."
            />
          }
          renderRow={(site) =>
            <HomeSiteRow site={site} onClick={()=>this.props.onVisitSite(site)} onDelete={()=>this.props.siteManager.remove(site)}/>
          }
        />
      )
    }
  }

  render() {
    // laft 500 on refresh control so it does not render incorrectly when
    // not refreshing
    return (
      <View style={styles.container}>
        <StatusBar />
        <HomeHeader
          onDidSubmitTerm={(term)=>this.doSearch(term)}
          lastRefreshTime={this.state.lastRefreshTime} />
        <Bar
          color='#f0ea89'
          borderWidth={0}
          borderRadius={0}
          height={this.state.addSiteProgress == 0 ? 0 : 6}
          progress={this.state.addSiteProgress}
          width={Dimensions.get('window').width} />
        {this.renderSites()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  term: {
    height: 40,
    paddingLeft: 10,
    marginBottom: 20
  },
  list: {
    flex: 10
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
  }
});

export default HomeScreen;
