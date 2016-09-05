/* @flow */
'use strict'

import React from 'react';
import { View } from 'react-native';
import { storiesOf } from '@kadira/react-native-storybook';
import HomeHeader from '../../js/components/home/HomeHeader';

storiesOf('HomeHeader')
  .addDecorator((story) => (
    <View style={{marginTop: 20}}>{story()}</View>
  ))
  .add('Default', () => {
    return <HomeHeader onDidPressAddSite={()=>console.warn("Did press add site")}/>
  })
