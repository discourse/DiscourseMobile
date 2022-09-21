/* @flow */
'use strict';

import React, {useContext, useState} from 'react';
import PropTypes from 'prop-types';
import {Animated, StyleSheet, TextInput, View, Platform} from 'react-native';
import i18n from 'i18n-js';
import {ThemeContext} from '../../ThemeContext';

export const HEIGHT = 48;

const TermBar = props => {
  const [text, setText] = useState('');
  const theme = useContext(ThemeContext);
  const translateY = props.anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 0],
  });
  const scaleY = props.anim.interpolate({
    inputRange: [0, 1],
    // hacky to fix unexpected behavior on Android
    outputRange: [Platform.OS === 'android' ? 0.00001 : 0, 1],
  });
  const transform = [{translateY}, {scaleY}];

  const handleSubmitTerm = term => {
    props
      .onDidSubmitTerm(term)
      .then(() => {
        setText('');
      })
      .catch(error => {
        setText(term);
      })
      .done();
  };

  return (
    <Animated.View style={[styles.container, {transform}]}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: theme.grayUILight,
        }}>
        <TextInput
          ref={props.getInputRef}
          keyboardType="url"
          returnKeyType="done"
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={event => handleSubmitTerm(event.nativeEvent.text)}
          placeholder={i18n.t('term_placeholder')}
          style={[styles.term, {color: theme.grayTitle}]}
          onChangeText={newText => setText(newText)}
          underlineColorAndroid={'transparent'}
          value={text}
        />
      </View>
    </Animated.View>
  );
};

TermBar.propTypes = {
  anim: PropTypes.object.isRequired,
  getInputRef: PropTypes.func,
  onDidSubmitTerm: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  term: {
    flex: 1,
    marginLeft: 15,
    marginRight: 15,
    fontSize: 18,
  },
  container: {
    justifyContent: 'center',
    overflow: 'hidden',
    height: HEIGHT,
  },
});

export default TermBar;
