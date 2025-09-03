/* @flow */
'use strict';

import React, { useContext } from 'react';
import { Dimensions, View } from 'react-native';
import Bar from 'react-native-progress/Bar';
import { ThemeContext } from './ThemeContext';

const ProgressBar = ({ progress, topInset }) => {
  const theme = useContext(ThemeContext);
  const height = progress === 0 ? 0 : 4;
  const { width } = Dimensions.get('window');

  return (
    <View
      style={{
        backgroundColor: 'transparent',
        position: 'absolute',
        top: topInset,
        left: 0,
        height,
      }}
    >
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

export default ProgressBar;
