/* @flow */
'use strict';

import React, { useContext } from 'react';
import { View } from 'react-native';
import Bar from 'react-native-progress/Bar';
import { ThemeContext } from './ThemeContext';

const ProgressBar = ({ progress, topInset, leftInset, rightInset }) => {
  const theme = useContext(ThemeContext);
  const height = progress === 0 ? 0 : 4;

  return (
    <View
      style={{
        backgroundColor: 'transparent',
        position: 'absolute',
        top: topInset,
        left: leftInset,
        right: rightInset,
        height,
      }}
    >
      <Bar
        borderRadius={0}
        borderWidth={0}
        color={theme.blueCallToAction}
        height={height}
        progress={progress}
        width={null}
      />
    </View>
  );
};

export default ProgressBar;
