'use strict'

import { StatusBar, View,WebView,Text,BackAndroid } from 'react-native'
import React from 'react'
import CrosswalkWebView from 'react-native-webview-crosswalk'

class Browser extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      url: this.props.url
    }

    this._backPressed = ()=>this.backPressed()
  }

  backPressed() {
    if (this.state.canGoBack) {
      this.webView.goBack()
    } else {
      this.props.done()
    }
    return true
  }

  componentDidMount() {
    BackAndroid.addEventListener('hardwareBackPress', this._backPressed)
  }

  componentWillUnmount() {
    BackAndroid.removeEventListener('hardwareBackPress', this._backPressed)
  }

  onNavigationStateChange = (navState) => {
    this.setState({
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
      url: navState.url,
      status: navState.title,
      loading: navState.loading
    });
  };

  get webView() {
    return this.refs["webview"]
  }


  render() {
    return (
      <View style={{flex: 1}}>
        <CrosswalkWebView
          style={{flex: 1}}
          ref="webview"
          url={this.props.url}
          url1={"https://meta.discourse.org"}
          onNavigationStateChange={this.onNavigationStateChange}
          />
      </View>
    )
  }
}

export default Browser
