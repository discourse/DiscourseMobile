/* @flow */
'use strict'

import React from 'react'

import PropTypes from 'prop-types'

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
    expanded: PropTypes.bool.isRequired,
    onDidSubmitTerm: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      termContainerScale: new Animated.Value(props.expanded ? 1 : 0),
      text: ''
    }
  }

  termContainerAnimatedTranslateY() {
    return this.state.termContainerScale.interpolate({
      inputRange: [0, 1],
      outputRange: [-24, 0]
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
    Animated.timing(this.state.termContainerScale, {
      easing: Easing.inOut(Easing.ease),
      duration: 200,
      toValue: value,
      useNativeDriver: true,
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
    const translateY = this.termContainerAnimatedTranslateY()
    const scaleY = this.state.termContainerScale.interpolate({
      inputRange: [0, 1],
      outputRange: [0.00001, 1] // hacky to fix unexpected behavior on Android
    })
    const transform = [{ translateY }, { scaleY }]
    return (
      <Animated.View style={[styles.container, {transform}]}>
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
    overflow: 'hidden',
    height: 48
  }
})

export default TermBar
