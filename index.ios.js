/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {
  Component,
  PropTypes
} from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TextInput,
  Image,
  AsyncStorage,
  TouchableOpacity,
  TouchableHighlight,
  Navigator,
  ListView,
  WebView,
  RefreshControl
} from 'react-native';

import CookieManager from 'react-native-cookies';
import Moment from 'moment';
import SafariView from 'react-native-safari-view';
import FetchBlob from 'react-native-fetch-blob';

// broken ... no crypto module
// import NodeRSA from 'node-rsa'

import SiteRow from './lib/components/site/row';

class SiteManager {

  constructor() {
    this._subscribers = [];
    this.sites = [];
    this.load();
  }

  add(site) {
    this.sites.push(site);
    this.save();
    this._onChange();
  }

  remove(site) {
    let index = this.sites.indexOf(site);
    if (index >= 0) {
      this.sites.splice(index,1);
      this.save();
      this._onChange()
    }
  }

  subscribe(callback) {
    this._subscribers.push(callback);
  }

  unsubscribe(callback) {
    var pos = this._subscribers.indexOf(callback);
    if (pos >= -1) {
      this._subscribers = this._subscribers.splice(pos,1);
    }
  }

  save() {
    AsyncStorage.setItem('@Discourse.sites', JSON.stringify(this.sites));
  }

  load() {
    AsyncStorage.getItem('@Discourse.sites').then((json) => {
      if (json) {
        this.sites = JSON.parse(json).map(obj=>new Site(obj));
        this._onChange()
      }
    });
  }

  refreshSites() {
    let sites = this.sites.slice(0);

    return new Promise((resolve,reject)=>{
      if (sites.length === 0) {
        resolve(false);
        return;
      }

      let site = sites.pop();
      let somethingChanged = false;

      let processSite = (site) => {
        site.refreshNotificationCounts().then((changed) => {
          somethingChanged = somethingChanged || changed;
          let s = sites.pop();
          if (s) { processSite(s); }
          else {
            if (somethingChanged) {
              this.save();
            }
            resolve(somethingChanged);
          }
        });
      };

      processSite(site);
    });
  }

  _onChange() {
    this._subscribers.forEach((sub) => sub());
  }
}

class Site {
  static FIELDS = ['authToken', 'title', 'description', 'icon', 'url', 'unreadNotifications'];

  static fromTerm(term) {
    let withProtocol = [];
    let url = "";

    term = term.trim();
    while (term.endsWith("/")) {
      term = term.slice(0, term.length-1);
    }

    if (!term.match(/^https?:\/\//)){
      url = "http://" + term;
    } else {
      url = term;
    }

    return Site.fromURL(url, term);
  }

  static fromURL(url, term) {


    let req = new Request(url + "/user-api-key/new", {
      method: 'HEAD'
    });

    return fetch(req)
      .then((r)=>{
        if (r.status !== 200) {
          alert("Sorry, " + term + " does not support mobile APIs, have owner upgrade Discourse to latest!")
          return;
        }

        // correct url in case we had a redirect
        let split = r.url.split("/")
        url = split[0] + "//" + split[2];

        return fetch(url + "/site/basic-info.json")
                 .then(r => r.json());

      })
      .then(info=>{
        return new Site({
          url: url,
          title: info.title,
          description: info.description,
          icon: info.apple_touch_icon_url
        });
      })
      .catch(e=>{
        alert(term + " was not found!")
      });
  }


  constructor(props) {
    if(props) {
      Site.FIELDS.forEach(prop=>{this[prop]=props[prop];});
    }
  }

  updateAuthCookie(done){
    CookieManager.get(this.url, (err, res) => {
      this.authToken = res && res["_t"];
      done();
    });
  }

  refreshNotificationCounts(){
    return new Promise((resolve,reject) => {

      if(!this.authToken) { resolve(false);  return;}

      FetchBlob.fetch('GET', this.url + "/session/current.json")
         .then(resp=>{
           currentUser = resp.json().current_user;

           let changed = false;
           if (this.unreadNotifications !== currentUser.unread_notifications) {
             this.unreadNotifications = currentUser.unread_notifications;
             changed = true;
           }

           resolve(changed);

          }).catch((e)=>{
           console.log(e);
           resolve(false);
         });
    });
  }

  toJSON(){
    let obj = {};
    Site.FIELDS.forEach(prop=>{obj[prop]=this[prop];});
    return obj;
  }

}

class DiscourseMobile extends Component {

  constructor(props) {
    super(props);
    this._siteManager = new SiteManager();
  }

  openUrl(navigator, site) {
    // navigator.push({title: site.url, index: 1, site: site});
    SafariView.show({url: site.url});
  }

  checkAuthCookie(navigator, site) {
    let oldToken = site.authToken;
    site.updateAuthCookie(()=>{
      if (oldToken !== site.authToken) {
        this._siteManager.save();
        console.warn("Auth token changed to" + site.authToken);
      }
    });
  }

  render() {
    return (
      <Navigator
        initialRoute={{ title: 'Discourse', index: 0 }}

        style={{flex: 1, paddingTop: 40}}

        navigationBar={
          <Navigator.NavigationBar
            style={{flex: 1}}
            routeMapper={{
               LeftButton: (route, navigator, index, navState) =>
                {
                  if (index === 0) { return null; }
                  return (
                    <TouchableHighlight onPress={() => navigator.pop()}>
                      <Text>back</Text>
                    </TouchableHighlight>);
                },
               RightButton: (route, navigator, index, navState) =>
                 { return null; },
               Title: (route, navigator, index, navState) =>
                 { return (<Text>{route.title}</Text>); },
            }}
          />
        }

        renderScene={(route, navigator) => {
            if(route.index == 0) {
              return <HomePage title={route.title}
                        style={{flex: 1}}
                        siteManager={this._siteManager}
                        onVisitSite={(site)=> this.openUrl(navigator, site)}
              />
            } else if(route.index == 1) {
              return (
                <WebViewScene
                    style={{flex: 1}}
                    title={route.site.url}
                    uri={route.site.url}
                    onLoadEnd={()=>{
                        this.checkAuthCookie(navigator, route.site)
                      }
                    }
                    onBack={()=>alert("back")}
                />
              );
            }
          }
        }
      />
    );
  }
}

class WebViewScene extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    onBack: PropTypes.func.isRequired,
    onLoadEnd: PropTypes.func.isRequired,
    uri: PropTypes.string.isRequired
  }

  render() {
    return (
        <WebView
            source={{uri: this.props.uri}}
            onLoadEnd={this.props.onLoadEnd}
        />
    );
  }

}


class HomePage extends Component {
  static propTypes = {
    onVisitSite: PropTypes.func.isRequired,
    siteManager: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);


    this._dataSource = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this._dataSource = this._dataSource.cloneWithRows(this.props.siteManager.sites);

    this.state = {
      dataSource: this._dataSource,
      isRefreshing: false,
      refreshMessage: ""
    }

    this._onChangeSites = () => this.onChangeSites();
    this.props.siteManager.subscribe(this._onChangeSites);
  }

  componentDidMount() {
    this.props.siteManager.refreshSites()
      .then(()=>{
        this.setState({
          refreshMessage: "Last updated: " + Moment().format("LT")
        })
      });
  }

  componentWillUnmount() {
    this.props.siteManager.unsubscribe(this._onChangeSites);
  }

  onChangeSites() {
    this._dataSource = this._dataSource.cloneWithRows(this.props.siteManager.sites);
    this.setState({
      dataSource: this._dataSource
    })
  }


  doSearch(term) {
    Site.fromTerm(term)
      .then(site => {
        if (site) {
          this.props.siteManager.add(site);
        }
      });
  }

  _onRefresh() {
    this.setState({isRefreshing: true});
    this.props.siteManager.refreshSites()
      .then(()=>{
      this.setState({
        isRefreshing: false,
        refreshMessage: "Last updated: " + Moment().format("LT")
      })
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.term}
          placeholder="Add Site"
          returnKeyType="search"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(search) => this.setState({search})}
          onSubmitEditing={()=>this.doSearch(this.state.search)}

        />
        <ListView
          dataSource={this.state.dataSource}
          enableEmptySections={true}
          styles={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={()=>this._onRefresh()}
              title="Loading..."
            />
          }
          renderRow={(site) =>
            <SiteRow site={site} onClick={()=>this.props.onVisitSite(site)} onDelete={()=>this.props.siteManager.remove(site)}/>
          }
        />
        <Text style={styles.statusLine}>{this.state.refreshMessage}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  term: {
    height: 40,
    paddingLeft: 10
  },
  list: {
    flex: 10
  },
  container: {
    flex: 1,
    padding: 10,
    justifyContent: 'flex-start',
    backgroundColor: '#FFFAFF',
  },
  statusLine: {
    color: "#777",
    fontSize: 10
  }
});

AppRegistry.registerComponent('DiscourseMobile', () => DiscourseMobile);
