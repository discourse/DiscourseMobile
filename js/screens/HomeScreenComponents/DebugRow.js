/* @flow */
'use strict'

import React from 'react'

import { StyleSheet, Text, View } from 'react-native'

import Moment from 'moment'

class DebugRow extends React.Component {
  componentDidMount() {
    this._subscription = () => {
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
      <View>
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
    fontSize: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    paddingLeft: 6,
    backgroundColor: 'transparent'
  }
})

export default DebugRow
