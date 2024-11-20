/* @flow */
'use strict';

import React, {useContext} from 'react';
import i18n from 'i18n-js';
import {Dimensions, Image, StyleSheet, Text, View} from 'react-native';
import {ThemeContext} from '../../ThemeContext';
import Popover, {PopoverMode} from 'react-native-popover-view';

const OnBoardingView = _props => {
  const dimensions = Dimensions.get('window');
  const bottomPosition = dimensions.scale < 3 ? 150 : 190;
  const theme = useContext(ThemeContext);
  const img =
    theme.name === 'light'
      ? require('../../../img/onboarding.png')
      : require('../../../img/onboarding-dark.png');

  return (
    <View style={{backgroundColor: theme.grayBackground, ...styles.container}}>
      <Popover
        from={{
          x: dimensions.width / 2,
          y: dimensions.height - bottomPosition,
        }}
        mode={PopoverMode.TOOLTIP}
        isVisible={true}
        popoverStyle={{
          ...styles.popoverDiscover,
          backgroundColor: theme.blueCallToAction,
        }}>
        <Text style={{color: theme.buttonTextColor}}>
          {i18n.t('find_new_communities')}
        </Text>
      </Popover>
      <View style={styles.illustrationContainer}>
        <Image
          style={{width: '100%', height: '100%'}}
          source={img}
          resizeMode="contain"
        />
      </View>
      <View style={styles.addSiteContainer}>
        <View style={styles.text}>
          <Text style={{...styles.title, color: theme.grayTitle}}>
            {i18n.t('no_sites_yet')}
          </Text>
          <Text style={{...styles.subtitle, color: theme.graySubtitle}}>
            {i18n.t('add_sites')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  illustrationContainer: {
    marginTop: 120,
    height: '35%',
    width: '100%',
  },
  addSiteContainer: {
    marginTop: 32,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  text: {
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  addSiteButtonText: {
    fontSize: 18,
    fontWeight: '500',
    padding: 12,
    textAlign: 'center',
  },
  popoverDiscover: {
    padding: 10,
  },
});

export default OnBoardingView;
