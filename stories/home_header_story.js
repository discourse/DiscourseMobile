'use strict';

import React from 'react';
import { View } from 'react-native';

import { storiesOf } from '@kadira/react-native-storybook';

import HomeHeader from '../js/components/home/header';

storiesOf('Home/Header')
  .addDecorator((story) => (
    <View>{story()}</View>
  ))
  .add('Default', () => {
    const options = {
      lastRefreshTime:'4:05'
    };

    return <HomeHeader lastRefreshTime={options.lastRefreshTime} />;
  })
