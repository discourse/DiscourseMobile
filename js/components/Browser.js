'use strict'

import { View,WebView,Text } from 'react-native'
import React from 'react'

class Browser extends React.Component {

  constructor(props) {
    super(props)

    alert(this.props.url)
    this.state = {
      url: this.props.url
    }
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <WebView source={{uri: this.state.url}} />
      </View>
    )
  }

}

export default Browser
