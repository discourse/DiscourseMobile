/* @flow */
'use strict'

import React from 'react'

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

class OnBoardingView extends React.Component {
  static propTypes = {
    onDidPressAddSite: React.PropTypes.func.isRequired
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          You don’t have any sites yet.{"\n"}
          Discourse notifier can keep track of your notifications across sites.
        </Text>

        <View style={styles.button}>
          <TouchableOpacity onPress={()=>this.props.onDidPressAddSite()}>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    padding: 24,
    marginBottom: 12
  },
  buttonText: {
    backgroundColor: '#e9e9e9',
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    padding: 8
  }
})

export default OnBoardingView
