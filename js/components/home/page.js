/**
 * @flow
 */

import React, {
  Component,
  PropTypes
} from 'react';

import {
  ListView,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';

import Moment from 'moment';

import Site from '../../site';
import SiteRow from '../site/row';
import HomeHeader from './header';

class HomePage extends Component {
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
      dataSource: this._dataSource,
      isRefreshing: false,
      lastRefreshTime: null
    }

    this._onChangeSites = (e) => this.onChangeSites(e);
    this.props.siteManager.subscribe(this._onChangeSites);
  }

  componentDidMount() {
    this.refreshSites({ui: false, fast: false});

    this.refresher = setInterval(()=>{
      this.refreshSites({ui: false, fast: true});
    }, 1000*60);
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
        lastRefreshTime: Moment().format("LT")
      });
    }
  }

  doSearch(term) {
    Site.fromTerm(term)
      .then(site => {
        if (site) {
          this.props.siteManager.add(site);
        }
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

  render() {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content"/>
        <HomeHeader
          onDidSubmitTerm={(term)=>this.doSearch(term)}
          lastRefreshTime={this.state.lastRefreshTime} />
        <ListView
          dataSource={this.state.dataSource}
          enableEmptySections={true}
          styles={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={()=>this.refreshSites({ui: true, fast: false})}
              title="Loading..."
            />
          }
          renderRow={(site) =>
            <SiteRow site={site} onClick={()=>this.props.onVisitSite(site)} onDelete={()=>this.props.siteManager.remove(site)}/>
          }
        />
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

export default HomePage;
