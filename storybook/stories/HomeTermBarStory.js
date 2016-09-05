/* @flow */
'use strict'

import React from 'react'
import { View } from 'react-native'
import { storiesOf } from '@kadira/react-native-storybook'
import HomeTermBar from '../../js/components/home/HomeTermBar'

storiesOf('HomeTermBar')
  .addDecorator((story) => (
    <View style={{marginTop: 20}}>{story()}</View>
  ))
  .add('Collapsed', () => {
    return (
      <HomeTermBar
        expanded={false}
        onDidSubmitTerm={(term)=>console.warn('didSubmitTerm', term)} />
    )
  })
  .add('Expanded', () => {
    return (
      <HomeTermBar
        expanded={true}
        onDidSubmitTerm={(term)=>console.warn('didSubmitTerm', term)} />
    )
  })
