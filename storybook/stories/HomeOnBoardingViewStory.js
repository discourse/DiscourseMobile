/* @flow */
'use strict'

import React from 'react'
import { View } from 'react-native'
import { storiesOf } from '@kadira/react-native-storybook'
import HomeOnBoardingView from '../../js/components/home/HomeOnBoardingView'

storiesOf('HomeOnBoardingView')
  .addDecorator((story) => (
    <View style={{marginTop: 20}}>{story()}</View>
  ))
  .add('Default', () => {
    return (
      <HomeOnBoardingView
        onDidPressAddSite={()=>console.warn('didPressAddSite')} />
    )
  })
