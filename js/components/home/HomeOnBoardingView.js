/* @flow */
'use strict'

import React from 'react'

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

class HomeOnBoardingView extends React.Component {
  static propTypes = {
    onDidPressAddSite: React.PropTypes.func.isRequired
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          You don’t have any sites yet.
          Discourse notifier can keep track
          of your notifications across sites.
        </Text>

        <View style={styles.button}>
          <TouchableOpacity onPress={()=>this.props.onDidPressAddSite()}>
            <Text style={styles.buttonText}>
              Add your first site
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
    alignItems: 'center'
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    padding: 12
  },
  buttonText: {
    backgroundColor: '#499',
    fontSize: 14,
    fontWeight: 'bold',
    borderRadius: 2,
    color: 'white',
    padding: 6
  }
})

export default HomeOnBoardingView
