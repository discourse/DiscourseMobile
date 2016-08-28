/* @flow */
'use strict'

import React from 'react'

import {
  ListView,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View
} from 'react-native'

import Dimensions from 'Dimensions'
import Moment from 'moment'
import { Bar } from 'react-native-progress'

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

    this._dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1.toJSON() !== r2.toJSON()
    })
    this._dataSource = this._dataSource.cloneWithRows(this.props.siteManager.sites)

    this.state = {
      addSiteProgress: 0,
      displayTermBar: false,
      dataSource: this._dataSource,
      isRefreshing: false,
      lastRefreshTime: null
    }

    this._onChangeSites = (e) => this.onChangeSites(e)
    this.props.siteManager.subscribe(this._onChangeSites)
  }

  componentDidMount() {
    this.refresher = setInterval(()=>{
      this.refreshSites({ui: false, fast: true})
    }, 1000 * 11)
  }

  componentWillUnmount() {
    this.props.siteManager.unsubscribe(this._onChangeSites)
    clearInterval(this.refresher)
  }

  onChangeSites(e) {

    if (e.event === 'change') {
      this._dataSource = this._dataSource.cloneWithRows(this.props.siteManager.sites)
      this.setState({
        dataSource: this._dataSource
      })
    }

    if (e.event === 'refresh') {
      this.setState({
        lastRefreshTime: Moment(this.props.siteManager.lastRefresh).format('LT')
      })
    }
  }

  doSearch(term) {
    this.setState({
      displayTermBar: false,
      addSiteProgress: Math.random() * 0.4
    })

    Site.fromTerm(term)
      .then(site => {
        this.setState({addSiteProgress: 1})

        if (site) {
          this.props.siteManager.add(site)
        }

        setTimeout(
          ()=>{ this.setState({addSiteProgress: 0}) },
          250
        )
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
            && this.state.lastRefreshTime
            && !this.refreshing
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
          addMode={!this.state.displayTermBar}
          onDidPressAddSite={()=>this.setState({displayTermBar: !this.state.displayTermBar})}
          lastRefreshTime={this.state.lastRefreshTime} />
        <HomeTermBar
          onDidSubmitTerm={(term)=>this.doSearch(term)}
          expanded={this.state.displayTermBar} />
        <Bar
          color="#f0ea89"
          borderWidth={0}
          borderRadius={0}
          height={this.state.addSiteProgress === 0 ? 0 : 6}
          progress={this.state.addSiteProgress}
          width={Dimensions.get('window').width} />
        {this.renderSites()}
      </View>
    )
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
})

export default HomeScreen
