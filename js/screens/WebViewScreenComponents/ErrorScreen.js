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
import i18n from 'i18n-js';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import { ThemeContext } from '../../ThemeContext';

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
      delay: 5000,
      useNativeDriver: true,
    }).start();
  }

  render() {
    let { errorName, errorData } = this.props;
    const theme = this.context;

    return (
      <View
        style={[styles.container, { backgroundColor: theme.grayBackground }]}
      >
        {errorName ? (
          <View style={[styles.box, { backgroundColor: theme.background }]}>
            <View>
              <Text
                style={{
                  fontSize: 24,
                  color: theme.grayTitle,
                  marginBottom: 30,
                }}
              >
                {i18n.t('oops')}
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={{ color: theme.grayTitle }}>
                {errorData && errorData.description
                  ? errorData.description
                  : errorName}
              </Text>
            </View>
            <View style={styles.section}>
              {this._renderButton(this.props.onRefresh, 'redo', theme)}
              {this._renderButton(this.props.onClose, 'times', theme)}
            </View>
          </View>
        ) : (
          <Animated.View
            style={{
              ...styles.box,
              opacity: this.state.fade,
              backgroundColor: theme.background,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 24,
                  color: theme.grayTitle,
                  marginBottom: 30,
                }}
              >
                {i18n.t('still_loading')}
              </Text>
            </View>
            <View style={styles.section}>
              {this._renderButton(this.props.onRefresh, 'redo', theme)}
              {this._renderButton(this.props.onClose, 'times', theme)}
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
        onPress={callback}
      >
        <FontAwesome5
          name={iconName}
          size={48}
          style={{ color: theme.grayTitle }}
          iconStyle="solid"
        />
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
    height: '40%',
    padding: 10,
    borderRadius: 10,
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
