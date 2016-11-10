/* @flow */
'use strict'

import React from 'react'

import {
  Animated,
  Easing,
  StyleSheet,
  TextInput,
  View
} from 'react-native'

import colors from '../../colors'

class TermBar extends React.Component {
  static propTypes = {
    expanded: React.PropTypes.bool.isRequired,
    onDidSubmitTerm: React.PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      termContainerHeight: new Animated.Value(props.expanded ? 1 : 0),
      text: ''
    }
  }

  termContainerAnimatedHeight() {
    return this.state.termContainerHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 48]
    })
  }

  hideTermInput() {
    let callback = ()=> { this.refs.Input.blur() }
    this.animateTermInputToValue(0, callback)
  }

  showTermInput() {
    let callback = ()=> { this.refs.Input.focus() }
    this.animateTermInputToValue(1, callback)
  }

  animateTermInputToValue(value, callback) {
    Animated.timing(this.state.termContainerHeight, {
      easing: Easing.inOut(Easing.ease),
      duration: 200,
      toValue: value
    }).start(callback)
  }

  handleSubmitTerm(term) {
    this.props.onDidSubmitTerm(term)
      .then(() => {
        this.setState({text: ''})
      })
      .catch(error => {
        this.setState({text: term})
        this.showTermInput()
      })
      .done()
  }

  componentWillReceiveProps(props) {
    props.expanded ? this.showTermInput() : this.hideTermInput()
  }

  render() {
    return (
      <Animated.View style={[styles.container, {height: this.termContainerAnimatedHeight()}]}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <TextInput
            ref="Input"
            selectionColor={colors.yellowUIFeedback}
            keyboardType="url"
            returnKeyType="done"
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={(event) => this.handleSubmitTerm(event.nativeEvent.text)}
            placeholder="meta.discourse.org"
            style={[styles.term]}
            onChangeText={(text) => this.setState({text})}
            underlineColorAndroid={'transparent'}
            value={this.state.text}
          />
        </View>
      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
  term: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12
  },
  container: {
    backgroundColor: colors.grayUILight,
    justifyContent: 'center',
    overflow: 'hidden'
  }
})

export default TermBar
