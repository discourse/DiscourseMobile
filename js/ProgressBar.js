/* @flow */
'use strict';

import React from 'react';
import {Dimensions, View} from 'react-native';
import {Bar} from 'react-native-progress';

import {ThemeContext} from './ThemeContext';

class ProgressBar extends React.Component {
  render() {
    let height = this.props.progress === 0 ? 0 : 3;
    const theme = this.context;

    return (
      <View
        style={[
          styles.container,
          {
            height: height,
            backgroundColor: theme.grayBackground,
          },
        ]}>
        <Bar
          color={theme.blueCallToAction}
          borderWidth={0}
          borderRadius={0}
          height={height}
          progress={this.props.progress}
          width={Dimensions.get('window').width}
        />
      </View>
    );
  }
}
ProgressBar.contextType = ThemeContext;

const styles = {
  container: {
    zIndex: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
};

export default ProgressBar;
