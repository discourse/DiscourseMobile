/* @flow */
'use strict'

import React from 'react'

import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

import Orientation from 'react-native-orientation'

class HomeHeader extends React.Component {
  static propTypes = {
    onDidPressAddSite: React.PropTypes.func.isRequired,
    lastRefreshTime: React.PropTypes.string
  }

  constructor(props) {
    super(props)
    this.state = {
      addMode: props.addMode || true,
      layoutWidth: Dimensions.get('window').width
    }
  }

  _orientationDidChange(orientation) {
    this.setState({layoutWidth: Dimensions.get('window').width})
  }

  componentDidMount() {
    Orientation.addOrientationListener(this._orientationDidChange.bind(this))
  }

  componentWillUnmount() {
    Orientation.removeOrientationListener(this._orientationDidChange.bind(this))
  }

  componentWillReceiveProps(props) {
    this.setState({addMode: props.addMode})
  }

  renderActionButton() {
    let text = this.state.addMode ? 'Add' : 'Cancel'
    return (
      <TouchableOpacity onPress={()=>this.props.onDidPressAddSite()}>
        <Text style={styles.actionButton}>{text}</Text>
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
      <View style={[styles.header, {width: this.state.layoutWidth}]}>
        <View style={styles.leftContainer}>
          {this.renderActionButton()}
        </View>
        <Image style={styles.icon} source={require('../../../img/nav-icon-gray.png')} />
        <View style={styles.rightContainer}>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 25,
    paddingBottom: 5,
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
    marginLeft: 0,
    flex: 2,
    height: 30,
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
    marginRight: 0,
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  actionButton: {
    paddingLeft: 10,
    overflow: 'hidden',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'left',
    color: '#616161',
    lineHeight: 25,
    paddingBottom: 10
  }
})

export default HomeHeader
