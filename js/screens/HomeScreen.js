/* @flow */
'use strict'

import React from 'react'

import {
  Alert,
  AppState,
  Linking,
  NativeModules,
  Platform,
  PushNotificationIOS,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native'

const ChromeCustomTab = NativeModules.ChromeCustomTab
const AndroidToken = NativeModules.AndroidToken

import SortableListView from 'react-native-sortable-listview'
import SafariView from 'react-native-safari-view'
import BackgroundFetch from '../../lib/background-fetch'

import SiteManager from '../site_manager'
import Site from '../site'
import Components from './HomeScreenComponents'
import ProgressBar from '../ProgressBar'

class HomeScreen extends React.Component {
  constructor(props) {
    super(props)

    this._siteManager = new SiteManager()

    this.state = {
      addSiteProgress: 0,
      displayTermBar: false,
      data: this._siteManager.toObject(),
      isRefreshing: false,
      lastRefreshTime: null,
      scrollEnabled: true
    }

    this._onChangeSites = (e) => this.onChangeSites(e)

    this._handleOpenUrl = (event) => {
      console.log('handling incoming url')
      console.log(event)
      let split = event.url.split('payload=')
      if (split.length === 2) {
        this.closeBrowser()
        this._siteManager.handleAuthPayload(decodeURIComponent(split[1]))
      }
    }

    this._handleAppStateChange = () => {
      console.log('Detected appstate change ' + AppState.currentState)

      if (AppState.currentState === 'inactive') {
        this._siteManager.enterBackground()
      }

      if (AppState.currentState === 'active') {
        this._siteManager.exitBackground()
        this._siteManager.refreshSites({ui: false, fast: true})
      }
    }

    if (Platform.OS === 'android') {
      AndroidToken.GetInstanceId(id=>{
        this._siteManager.registerClientId(id)
      })
    }

    if (Platform.OS === 'ios') {
      SafariView.addEventListener('onShow', () => {
        this._siteManager.refreshInterval(60000)
      })

      SafariView.addEventListener('onDismiss', () => {
        this._siteManager.refreshInterval(15000)
        this._siteManager.refreshSites({ui: false, fast: true})
      })

      PushNotificationIOS.addEventListener('notification', (e) => this._handleRemoteNotification(e))
      PushNotificationIOS.addEventListener('localNotification', (e) => this._handleLocalNotification(e))

      PushNotificationIOS.addEventListener('register', (s) => {
        this._siteManager.registerClientId(s)
      })
    }

    if (this.props.url) {
      this.visitUrl(this.props.url)
    }
  }

  _handleLocalNotification(e) {
    console.log('got local notification')
    console.log(e)
    if (AppState.currentState !== 'active' && e._data && e._data.discourse_url) {
      console.log('open safari view')
      SafariView.show({url: e._data.discourse_url})
    }
  }

  _handleRemoteNotification(e) {
    console.log('got remote notification')
    console.log(e)
    if (e._data && e._data.AppState === 'inactive' && e._data.discourse_url) {
      console.log('open safari view')
      SafariView.show({url: e._data.discourse_url})
    }

    // TODO if we are active we should try to notify user somehow that a notification
    // just landed .. tricky thing though is that safari view may be showing so we have
    // no way of presenting anything to the user in that case
  }

  openUrl(site) {
    if (site.authToken) {
      this.visitUrl(site.url)
      return
    }

    this._siteManager
      .generateAuthURL(site)
      .then(url => {
        this.visitUrl(url)
      })
  }

  visitUrl(url) {
    if (Platform.OS === 'ios') {
      SafariView.show({url})
    } else {
      if (this.props.simulator) {
        Linking.openURL(url)
      } else {
        ChromeCustomTab.show(url)
          .then(()=>{})
          .catch((e)=>{alert(e)})
      }
    }
  }

  closeBrowser() {
    if (Platform.OS === 'ios') {
      SafariView.dismiss()
    } else {
      // TODO decide if we need this for android, probably not, its just a hack
    }
  }

  componentDidMount() {
    Linking.addEventListener('url', this._handleOpenUrl)
    AppState.addEventListener('change', this._handleAppStateChange)

    if (Platform.OS === 'ios') {
      let doRefresh = () => {

        console.log('Background fetch Called!')

        this._siteManager.refreshSites({ui: false, fast: true, background: true})
          .then((state)=>{

            console.log('Finished refreshing sites in BG fetch!')
            console.log(state)

            if (state.alerts) {

              console.log('Got ' + state.alerts.length + ' alert in BG fetch')

              state.alerts.forEach((a) => {

                if (a.excerpt) {
                  let excerpt = a.username + ': '  + a.excerpt
                  excerpt = excerpt.substr(0,250)

                  if (!a.site.hasPush) {
                    console.log(`publishing local notifications for ${a.site.url}`)
                    PushNotificationIOS.presentLocalNotification({
                      alertBody: excerpt,
                      userInfo: {discourse_url: a.url}
                    })
                  }
                }
              })
            }
          })
        .catch((e) => {
          console.log('WARN: failed in bg fetch')
          console.log(e)
        })
        .finally(() => {
          PushNotificationIOS.checkPermissions(p => {
            if (p.badge) {
              let total = this._siteManager.totalUnread()
              console.log('Setting badge to ' + total)
              PushNotificationIOS.setApplicationIconBadgeNumber(total)
            }

            console.log('finishing up background fetch')
            BackgroundFetch.done(true)
          })
        })
      }

      BackgroundFetch.addEventListener('backgroundFetch', ()=>{
        if (this._siteManager.refreshing) {
          // assume prviously aborted and force allow a refresh
          console.log('WARNING: forcing refresh cause _siteManager was stuck refreshing')
          this._siteManager.refreshing = false
        }

        doRefresh()
      })
    }

    this._siteManager.subscribe(this._onChangeSites)
    this._siteManager.refreshInterval(15000)
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this._handleOpenUrl)
    AppState.addEventListener('change', this._handleAppStateChange)

    this._siteManager.unsubscribe(this._onChangeSites)
  }

  onChangeSites(e) {
    if (e.event === 'change') {
      this.setState({
        data: this._siteManager.toObject()
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
          if (this._siteManager.exists(site)) {
            throw 'dupe site'
          }
          this._siteManager.add(site)
        }

        setTimeout(
          ()=>{ this.setState({addSiteProgress: 0}) },
          250
        )
      })
      .catch(e=>{
        console.log(e)
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

    this._siteManager.refreshSites(opts)
      .then(()=>{
        this.refreshing = false
        this.setState({
          isRefreshing: false
        })
    })
  }

  shouldDisplayOnBoarding() {
    return this._siteManager.sites.length === 0
            && !this.refreshing
            && !this.state.isRefreshing
            && this.state.addSiteProgress === 0
            && !this.state.displayTermBar
  }

  renderSites() {
    if (this.shouldDisplayOnBoarding()) {
      return (
        <Components.OnBoardingView
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
            return new Site(r1).toJSON() !== new Site(r2).toJSON()
          }}
          onRowMoved={(e)=> {
            this._siteManager.updateOrder(e.from, e.to)
            this.forceUpdate()
          }}
          refreshControl={
            <RefreshControl
              style={{left: 500}}
              refreshing={this.state.isRefreshing}
              onRefresh={()=>this.refreshSites({ui: true, fast: false})}
              title="Loading..."
              titleColor="#919191"
            />
          }
          renderRow={(site) =>
            <Components.SiteRow
              site={site}
              onSwipe={(scrollEnabled)=>this.setState({scrollEnabled: scrollEnabled})}
              onClick={()=>this.openUrl(site)}
              onDelete={()=>this._siteManager.remove(site)} />
          }
        />
      )
    }
  }

  onDidPressLeftButton() {
    this.setState({displayTermBar: !this.state.displayTermBar})
  }

  onDidPressRighButton() {
    this.props.navigator.push({identifier:'NotificationsScreen', index:1})
  }

  render() {
    // left 500 on refresh control so it does not render incorrectly when
    // not refreshing
    return (
      <View style={styles.container}>
        <Components.NavigationBar
          leftButtonIconName={this.state.displayTermBar ? 'close' : 'plus'}
          onDidPressLeftButton={() => this.onDidPressLeftButton()}
          onDidPressRightButton={() => this.onDidPressRighButton()}
        />
        <ProgressBar progress={this.state.addSiteProgress} />
        <Components.TermBar
          onDidSubmitTerm={(term)=>this.doSearch(term)}
          expanded={this.state.displayTermBar}
        />
        {this.renderSites()}
        <Components.DebugRow siteManager={this._siteManager} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa'
  }
})

export default HomeScreen
