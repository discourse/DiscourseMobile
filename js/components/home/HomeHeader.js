/* @flow */
'use strict'

import React from 'react'

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

class HomeHeader extends React.Component {
  static propTypes = {
    onDidPressAddSite: React.PropTypes.func.isRequired,
    lastRefreshTime: React.PropTypes.string
  }

  constructor(props) {
    super(props)
    this.state = {
      addMode: props.addMode || true
    }
  }

  componentWillReceiveProps(props) {
    this.setState({addMode: props.addMode})
  }

  renderRightButton() {
    let text = this.state.addMode ? 'Add' : 'Cancel'
    return (
      <TouchableOpacity onPress={()=>this.props.onDidPressAddSite()}>
        <Text style={styles.rightButton}>{text}</Text>
      </TouchableOpacity>
    )
  }

  renderLastUpdate() {
    if (this.props.lastRefreshTime && this.props.lastRefreshTime.length > 0) {
      return (
        <View style={styles.leftContainer}>
          <Text style={styles.lastUpdatedTextTitle}>Last updated</Text>
          <Text style={styles.lastUpdatedTextSubtitle}>
            {this.props.lastRefreshTime}
          </Text>
        </View>
      )
    } else {
      return (
        <View style={styles.leftContainer}/>
      )
    }
  }

  render() {
    return (
      <View style={styles.header}>
        {this.renderLastUpdate()}
        <Image style={styles.icon} source={require('../../../img/nav-icon-gray.png')} />
        <View style={styles.rightContainer}>
          {this.renderRightButton()}
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 25,
    paddingBottom: 10,
    backgroundColor: '#f3f3f3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  icon: {
    resizeMode: 'contain',
    height: 40
  },
  leftContainer: {
    flex: 2,
    marginLeft: 5
  },
  lastUpdatedTextTitle: {
    color: '#9c9b9d',
    fontWeight: '600',
    fontSize: 12
  },
  lastUpdatedTextSubtitle: {
    color: '#9c9b9d',
    fontSize: 12
  },
  rightContainer: {
    flex: 2,
    marginRight: 5,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  rightButton: {
    backgroundColor: '#DDD',
    padding: 8,
    borderRadius: 2,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    color: '#616161'
  }
})

export default HomeHeader
