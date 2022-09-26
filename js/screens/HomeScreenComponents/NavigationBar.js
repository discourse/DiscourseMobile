/* @flow */
'use strict';

import React, {useContext, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import ProgressBar from '../../ProgressBar';
import {ThemeContext} from '../../ThemeContext';
import i18n from 'i18n-js';

const NavigationBar = props => {
  const theme = useContext(ThemeContext);

  const rotationValue = useRef(
    new Animated.Value(props.leftButtonIconRotated ? 1 : 0),
  ).current;

  useEffect(() => {
    Animated.spring(rotationValue, {
      toValue: props.leftButtonIconRotated ? 1 : 0,
      duration: 50,
      useNativeDriver: true,
    }).start();
  }, [rotationValue, props.leftButtonIconRotated]);

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <ProgressBar progress={props.progress} />
      <View style={styles.leftContainer}>
        <TouchableHighlight
          underlayColor={'transparent'}
          accessibilityLabel={i18n.t('add_site')}
          style={[styles.button]}
          onPress={props.onDidPressLeftButton}>
          <AnimatedIcon
            name="plus"
            color={theme.grayUI}
            size={20}
            style={[
              styles.animatedIcon,
              {
                transform: [
                  {
                    rotate: rotationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '225deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        </TouchableHighlight>
      </View>
      <View style={styles.titleContainer}>
        <TouchableHighlight underlayColor={'transparent'}>
          <FontAwesome5
            name={'discourse'}
            size={20}
            brand
            style={{color: theme.grayTitle}}
          />
        </TouchableHighlight>
      </View>
      <View style={styles.rightContainer}>
        <TouchableHighlight
          underlayColor={'transparent'}
          accessibilityLabel={i18n.t('notifications')}
          style={styles.button}
          onPress={props.onDidPressRightButton}>
          <FontAwesome5
            name={'bell'}
            color={props.rightButtonIconColor}
            size={20}
            solid
          />
        </TouchableHighlight>
      </View>
      <View
        style={[styles.separator, {backgroundColor: theme.grayBackground}]}
      />
    </View>
  );
};

NavigationBar.propTypes = {
  leftButtonIconRotated: PropTypes.bool.isRequired,
  rightButtonIconColor: PropTypes.string.isRequired,
  onDidPressRightButton: PropTypes.func.isRequired,
  onDidPressLeftButton: PropTypes.func.isRequired,
};

const AnimatedIcon = Animated.createAnimatedComponent(FontAwesome5);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 40 : 55,
  },
  leftContainer: {
    flex: 1,
  },
  rightContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    bottom: 0,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  animatedIcon: {
    backgroundColor: 'transparent',
  },
  button: {
    width: Platform.OS === 'ios' ? 44 : 55,
    height: Platform.OS === 'ios' ? 44 : 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NavigationBar;
