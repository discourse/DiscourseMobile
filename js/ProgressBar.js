/* @flow */
'use strict';

import React, {useContext} from 'react';
import {Dimensions, View} from 'react-native';
import {Bar} from 'react-native-progress';
import {ThemeContext} from './ThemeContext';

const ProgressBar = ({progress}) => {
  const theme = useContext(ThemeContext);
  const height = progress === 0 ? 0 : 3;
  const {width} = Dimensions.get('window');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.grayBackground,
          height,
        },
      ]}>
      <Bar
        borderRadius={0}
        borderWidth={0}
        color={theme.blueCallToAction}
        height={height}
        progress={progress}
        width={width}
      />
    </View>
  );
};

const styles = {
  container: {
    zIndex: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
};

export default ProgressBar;
