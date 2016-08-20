'use strict';

import React from 'react';
import { View } from 'react-native';

import { storiesOf } from '@kadira/react-native-storybook';

import Header from '../lib/components/home/header';

storiesOf('Home/Header')
  .addDecorator((story) => (
    <View>{story()}</View>
  ))
  .add('Default', () => {
    const options = {
      lastRefreshTime:'4:05'
    };

    return <Header lastRefreshTime={options.lastRefreshTime} />;
  })
