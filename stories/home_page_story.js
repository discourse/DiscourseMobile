'use strict';

import React from 'react';
import { View } from 'react-native';

import { storiesOf } from '@kadira/react-native-storybook';

import HomePage from '../js/components/home/page';
import SiteManager from '../js/site_manager';

storiesOf('Home/Page')
  .addDecorator((story) => (
    <View>{story()}</View>
  ))
  .add('Default', () => {
    const siteManager = new SiteManager();

    return (
      <HomePage
        onVisitSite={(site)=> console.log(site)}
        siteManager={siteManager} />
    );
  })
