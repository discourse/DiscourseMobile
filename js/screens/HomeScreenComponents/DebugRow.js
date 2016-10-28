/* @flow */
'use strict'

import React from 'react'

import {
  StyleSheet,
  Text,
  View
} from 'react-native'

import Moment from 'moment'

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
        <Text style={styles.debugText}>
          Last Updated: {Moment(this.state.lastRefresh).format('h:mmA')}
        </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  debugText: {
    color: '#777',
    fontSize: 10
  }
})

export default DebugRow
