/* @flow */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import {
  Animated,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import {ThemeContext} from '../../ThemeContext';

class ErrorScreen extends React.Component {
  static propTypes = {
    onRefresh: PropTypes.func,
    onClose: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      fade: new Animated.Value(0),
    };
  }

  componentDidMount() {
    Animated.timing(this.state.fade, {
      toValue: 0.75,
      duration: 500,
      delay: 6000,
    }).start();
  }

  render() {
    let {errorName, errorData} = this.props;
    const theme = this.context;

    return (
      <View style={[styles.container, {backgroundColor: theme.grayBackground}]}>
        {errorName ? (
          <View style={[styles.box, {backgroundColor: theme.background}]}>
            <View>
              <Text style={{fontSize: 24, color: theme.grayTitle}}>
                Oops, there was an error.
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={{color: theme.grayTitle}}>
                {errorData && errorData.description
                  ? errorData.description
                  : errorName}
              </Text>
            </View>
            <View style={styles.section}>
              {this._renderButton(this.props.onRefresh, 'ios-refresh', theme)}
              {this._renderButton(
                this.props.onClose,
                'ios-close-circle-outline',
                theme,
              )}
            </View>
          </View>
        ) : (
          <Animated.View
            style={{
              ...styles.box,
              opacity: this.state.fade,
              backgroundColor: theme.background,
            }}>
            <View>
              <Text style={{fontSize: 20, color: theme.grayTitle}}>
                Still loading...
              </Text>
            </View>
            <View style={styles.section}>
              {this._renderButton(this.props.onRefresh, 'ios-refresh', theme)}
              {this._renderButton(
                this.props.onClose,
                'ios-close-circle-outline',
                theme,
              )}
            </View>
          </Animated.View>
        )}
      </View>
    );
  }

  _renderButton(callback, iconName, theme) {
    return (
      <TouchableHighlight
        underlayColor={'transparent'}
        style={styles.button}
        onPress={callback}>
        <Icon name={iconName} size={42} style={{color: theme.grayTitle}} />
      </TouchableHighlight>
    );
  }
}
ErrorScreen.contextType = ThemeContext;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    height: '50%',
    padding: 10,
  },
  section: {
    flexDirection: 'row',
    margin: 10,
  },
  button: {
    padding: 20,
    flex: 1,
    alignItems: 'center',
  },
});

export default ErrorScreen;
