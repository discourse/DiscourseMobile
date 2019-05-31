/* @flow */
"use strict";

import React from "react";

import PropTypes from "prop-types";

import {
  Animated,
  StyleSheet,
  Text,
  TouchableHighlight,
  View
} from "react-native";

import Icon from "react-native-vector-icons/Ionicons";
import colors from "../../colors";
import { SafeAreaView } from "react-navigation";

class ErrorScreen extends React.Component {
  static propTypes = {
    onRefresh: PropTypes.func,
    onClose: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      fade: new Animated.Value(0)
    };
  }

  componentDidMount() {
    Animated.timing(this.state.fade, {
      toValue: 0.75,
      duration: 500,
      delay: 6000
    }).start();
  }

  render() {
    let { errorName, errorData } = this.props;
    return (
      <SafeAreaView
        style={styles.container}
        forceInset={{ top: "always", bottom: "always" }}
      >
        {errorName ? (
          <View style={styles.box}>
            <View>
              <Text style={{ fontSize: 24 }}>Oops, there was an error.</Text>
            </View>
            <View style={styles.section}>
              <Text>
                {errorData && errorData.description
                  ? errorData.description
                  : errorName}
              </Text>
            </View>
            <View style={styles.section}>
              {this._renderButton(this.props.onRefresh, "ios-refresh")}
              {this._renderButton(
                this.props.onClose,
                "ios-close-circle-outline"
              )}
            </View>
          </View>
        ) : (
          <Animated.View style={{ ...styles.box, opacity: this.state.fade }}>
            <View>
              <Text style={{ fontSize: 20 }}>Still loading...</Text>
            </View>
            <View style={styles.section}>
              {this._renderButton(this.props.onRefresh, "ios-refresh")}
              {this._renderButton(
                this.props.onClose,
                "ios-close-circle-outline"
              )}
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    );
  }

  _renderButton(callback, iconName) {
    return (
      <TouchableHighlight
        underlayColor={"transparent"}
        style={styles.button}
        onPress={callback}
      >
        <Icon name={iconName} size={42} />
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
    position: 'absolute',
    height: '100%',
    width: '100%'
  },
  box: {
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    height: "50%",
    backgroundColor: "white",
    padding: 10
  },
  section: {
    flexDirection: "row",
    margin: 10
  },
  button: {
    padding: 20,
    flex: 1,
    alignItems: "center"
  }
});

export default ErrorScreen;
