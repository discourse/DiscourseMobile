/* @flow */
'use strict'

import React from 'react'

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

import colors from '../../colors'

class OnBoardingView extends React.Component {
  static propTypes = {
    onDidPressAddSite: React.PropTypes.func.isRequired
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          <Text style={{color: colors.grayTitle}}>
            You don’t have any sites yet.
          </Text>
          {'\n'}
          <Text style={{color: colors.graySubtitle}}>
            Add Discourse sites to keep track of.
          </Text>
        </Text>

        <View style={styles.button}>
          <TouchableOpacity onPress={() => this.props.onDidPressAddSite()}>
            <Text style={styles.buttonText}>
              + Add your first site
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center'
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
    padding: 24,
    textAlign: 'center'
  },
  buttonText: {
    backgroundColor: colors.blueCallToAction,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    padding: 8
  }
})

export default OnBoardingView
