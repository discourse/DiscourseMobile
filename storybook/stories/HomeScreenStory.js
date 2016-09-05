/* @flow */
'use strict'

import React from 'react'
import { View } from 'react-native'
import { storiesOf } from '@kadira/react-native-storybook'
import HomeScreen from '../../js/components/home/HomeScreen'
import SiteManager from '../../js/site_manager'

storiesOf('HomeScreen')
  .addDecorator((story) => (
    <View>{story()}</View>
  ))
  .add('Default', () => {
    const siteManager = new SiteManager()

    return (
      <HomeScreen
        onVisitSite={(site)=> console.log(site)}
        siteManager={siteManager} />
    );
  })
