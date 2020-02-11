/* @flow */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {Animated, StyleSheet, TextInput, View, Platform} from 'react-native';

import {ThemeContext} from '../../ThemeContext';

class TermBar extends React.Component {
  static Height = 48;
  static propTypes = {
    anim: PropTypes.object.isRequired,
    getInputRef: PropTypes.func,
    onDidSubmitTerm: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      text: '',
    };
  }

  handleSubmitTerm(term) {
    this.props
      .onDidSubmitTerm(term)
      .then(() => {
        this.setState({text: ''});
      })
      .catch(error => {
        this.setState({text: term});
      })
      .done();
  }

  render() {
    const theme = this.context;
    const translateY = this.props.anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-24, 0],
    });
    const scaleY = this.props.anim.interpolate({
      inputRange: [0, 1],
      // hacky to fix unexpected behavior on Android
      outputRange: [Platform.OS === 'android' ? 0.00001 : 0, 1],
    });
    const transform = [{translateY}, {scaleY}];
    return (
      <Animated.View style={[styles.container, {transform}]}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: theme.grayUILight,
          }}>
          <TextInput
            ref={this.props.getInputRef}
            keyboardType="url"
            returnKeyType="done"
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={event =>
              this.handleSubmitTerm(event.nativeEvent.text)
            }
            placeholder="meta.discourse.org"
            style={[styles.term, {color: theme.grayTitle}]}
            onChangeText={text => this.setState({text})}
            underlineColorAndroid={'transparent'}
            value={this.state.text}
          />
        </View>
      </Animated.View>
    );
  }
}

TermBar.contextType = ThemeContext;

const styles = StyleSheet.create({
  term: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  container: {
    justifyContent: 'center',
    overflow: 'hidden',
    height: TermBar.Height,
  },
});

export default TermBar;
