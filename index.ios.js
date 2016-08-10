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
  TouchableHighlight,
  Navigator,
  ListView,
  WebView
} from 'react-native';

import CookieManager from 'react-native-cookies';
import FetchBlob from 'react-native-fetch-blob';


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
        this.sites = JSON.parse(json);
        this._onChange()
      }
    });
  }

  _onChange() {
    this._subscribers.forEach((sub) => sub());
  }
}

class Site {
  save(){
    this._siteManager.save();
  }

  updateAuthCookie(){
    CookieManager.get(this.url, (err, res) => {
      console.log('Got cookies for url', res);
    });
  }

  refreshNotificationCounts(){
  }
}

class DiscourseMobile extends Component {

  constructor(props) {
    super(props);
    this._siteManager = new SiteManager();
  }

  openUrl(navigator, site) {
    navigator.push({title: site.url, index: 1, site: site});
  }

  checkAuthCookie(navigator, site) {
  }

  render() {
    return (
      <Navigator
        initialRoute={{ title: 'Discourse', index: 0 }}
        renderScene={(route, navigator) => {
            if(route.index == 0) {
              return <HomePage title={route.title}
                        siteManager={this._siteManager}
                        onVisitSite={(site)=> this.openUrl(navigator, site)}
              />
            } else if(route.index == 1) {
              return <WebView source={{uri: route.site.url}}
                              onLoadEnd={() =>
                                this.checkAuthCookie(navigator, route.site)}
              />
            }
          }
        }
        style={{paddingTop: 20}}
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
      dataSource: this._dataSource
    }

    this._onChangeSites = () => this.onChangeSites();
    this.props.siteManager.subscribe(this._onChangeSites);
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

  parseSite(body,url) {
    var titleRegex = /<title>(.*)<\/title>/gi;
    var title = titleRegex.exec(body)[1];

    var descriptionRegex = /<meta name="description" content="([^"]*)">/;
    var description = descriptionRegex.exec(body)[1];

    var iconRegex = /<link rel="apple-touch-icon"[^>]*href="([^"]*)">/;
    var icon = iconRegex.exec(body)[1];

    this.props.siteManager.add({title, description, icon, url});

  }

  doSearch(term) {
    FetchBlob.fetch('GET', term)
      .then((resp)=>this.parseSite(resp.text(), term))
      .catch((e)=>alert(term + " not found! " + e))
  }

  render() {
    return (
      <View>
        <TextInput
          style={styles.term}
          placeholder="Add Site"
          returnKeyType="search"
          keyboardType="url"
          autoCapitalize="none"
          onChangeText={(search) => this.setState({search})}
          onSubmitEditing={()=>this.doSearch(this.state.search)}

        />
        <ListView
          dataSource={this.state.dataSource}
          renderRow={(rowData) =>
             <TouchableHighlight
                onPress={()=>this.props.onVisitSite(rowData)}>
              <View accessibilityTraits="link" style={styles.row}>
                <Image style={styles.icon} source={{uri: rowData.icon}} style={{width: 40, height: 40}} />
                <View style={styles.info}>
                  <Text>
                    {rowData.description}
                  </Text>
                  <Text>
                    {rowData.url}
                  </Text>
                </View>
              </View>
            </TouchableHighlight>
          }
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  term: {
    height: 40,
    paddingLeft: 10
  },
  icon: {
  },
  info: {
    paddingLeft: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 10,
    paddingBottom: 20
  },
  container: {
    paddingTop: 22,
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#FFFAFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('DiscourseMobile', () => DiscourseMobile);
