/* @flow */
'use strict'

import React from 'react'

import {
  Alert,
  ListView,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
  Text
} from 'react-native'

import Dimensions from 'Dimensions'
import Moment from 'moment'
import { Bar } from 'react-native-progress'
import SortableListView from 'react-native-sortable-listview'

import Site from '../../site'
import HomeSiteRow from './HomeSiteRow'
import HomeHeader from './HomeHeader'
import HomeTermBar from './HomeTermBar'
import HomeOnBoardingView from './HomeOnBoardingView'

class HomeScreen extends React.Component {
  static propTypes = {
    onVisitSite: React.PropTypes.func.isRequired,
    siteManager: React.PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      addSiteProgress: 0,
      displayTermBar: false,
      data: this.props.siteManager.toObject(),
      isRefreshing: false,
      lastRefreshTime: null,
      scrollEnabled: true
    }

    this._onChangeSites = (e) => this.onChangeSites(e)
  }

  componentDidMount() {
    this.props.siteManager.subscribe(this._onChangeSites)
    this.props.siteManager.refreshInterval(15000)
  }

  componentWillUnmount() {
    this.props.siteManager.unsubscribe(this._onChangeSites)
  }

  onChangeSites(e) {
    if (e.event === 'change') {
      this.setState({
        data: this.props.siteManager.toObject()
      })
    }
  }

  doSearch(term) {
    this.setState({
      addSiteProgress: Math.random() * 0.4
    })

    return Site.fromTerm(term)
      .then(site => {
        this.setState({
          displayTermBar: false,
          addSiteProgress: 1
        })

        if (site) {
          if (this.props.siteManager.exists(site)) {
            throw "dupe site"
          }
          this.props.siteManager.add(site)
        }

        setTimeout(
          ()=>{ this.setState({addSiteProgress: 0}) },
          250
        )
      })
      .catch(e=>{
        if ( e === 'dupe site') {
          Alert.alert(`${term} already exists`)
        } else if (e === 'bad api') {
          Alert.alert(`Sorry, ${term} does not support mobile APIs, have owner upgrade Discourse to latest!`)
        } else {
          Alert.alert(`${term} was not found!`)
        }
        this.setState({addSiteProgress: 0})
        throw 'failure'
      })
  }

  refreshSites(opts) {
    if (this.refreshing) { return false }

    if (opts.ui) {
      this.setState({isRefreshing: true})
    }

    this.props.siteManager.refreshSites(opts)
      .then(()=>{
        this.refreshing = false
        this.setState({
          isRefreshing: false
        })
    })
  }

  shouldDisplayOnBoarding() {
    return this.props.siteManager.sites.length === 0
            && !this.refreshing
            && !this.state.isRefreshing
            && this.state.addSiteProgress === 0
            && !this.state.displayTermBar
  }

  renderSites() {
    if (this.shouldDisplayOnBoarding()) {
      return (
        <HomeOnBoardingView
          onDidPressAddSite={()=>this.setState({displayTermBar: true})} />
      )
    } else {
      return (
        <SortableListView
          data={this.state.data}
          order={Object.keys(this.state.data)}
          scrollEnabled={this.state.scrollEnabled}
          enableEmptySections={true}
          styles={styles.list}
          rowHasChanged={(r1, r2)=> {
            // TODO: r2 returns as an Object instead of a Site
            // casting Site shouldn't be needed
            return new Site(r1).toJSON() != new Site(r2).toJSON()
          }}
          onRowMoved={(e)=> {
            this.props.siteManager.updateOrder(e.from, e.to)
            this.forceUpdate()
          }}
          refreshControl={
            <RefreshControl
              style={{left: 500}}
              refreshing={this.state.isRefreshing}
              onRefresh={()=>this.refreshSites({ui: true, fast: false})}
              title="Loading..." />
          }
          renderRow={(site) =>
            <HomeSiteRow
              site={site}
              onSwipe={(scrollEnabled)=>this.setState({scrollEnabled: scrollEnabled})}
              onClick={()=>this.props.onVisitSite(site)}
              onDelete={()=>this.props.siteManager.remove(site)} />
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
          addMode={!this.state.displayTermBar}
          onDidPressAddSite={()=>this.setState({displayTermBar: !this.state.displayTermBar})} />
        <HomeTermBar
          onDidSubmitTerm={(term)=>this.doSearch(term)}
          expanded={this.state.displayTermBar} />
        <Bar
          color="#f0ea89"
          borderWidth={0}
          borderRadius={0}
          style={{top: -5}}
          height={this.state.addSiteProgress === 0 ? 0 : 5}
          progress={this.state.addSiteProgress}
          width={Dimensions.get('window').width} />
        {this.renderSites()}
        <DebugRow siteManager={this.props.siteManager}/>
      </View>
    )
  }
}


class DebugRow extends React.Component {
  componentDidMount() {
    this._subscription = ()=> {
      this.setState({
        firstFetch: this.props.siteManager.firstFetch,
        lastFetch: this.props.siteManager.lastFetch,
        fetchCount: this.props.siteManager.fetchCount,
        lastRefresh: this.props.siteManager.lastRefresh
      })
    }
    this.props.siteManager.subscribe(this._subscription)
  }

  componentWillUnmount() {
    this.props.siteManager.unsubscribe(this._subscription)
    this._subscription = null
  }

  constructor(props) {
    super(props)

    this.state = {
      firstFetch: this.props.siteManager.firstFetch,
      lastFetch: this.props.siteManager.lastFetch,
      fetchCount: this.props.siteManager.fetchCount,
      lastRefresh: this.props.siteManager.lastRefresh
    }

  }

  render() {
    return (
      <View style={{padding: 5}}>
         <Text style={styles.debug}>Last Updated: {Moment(this.state.lastRefresh).format('h:mmA')}</Text>
         <Text style={styles.debug}>Background fetch stats (first/last/count): {Moment(this.state.firstFetch).format('h:mmA')}/{Moment(this.state.lastFetch).format('h:mmA')}/{this.state.fetchCount}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  debug: {
    color: '#777',
    fontSize: 10
  },
  list: {
    flex: 1
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
})

export default HomeScreen
