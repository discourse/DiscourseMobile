/* @flow */
'use strict';

import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import i18n from 'i18n-js';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ThemeContext} from '../../ThemeContext';

const OnBoardingView = props => {
  const theme = useContext(ThemeContext);
  const img =
    theme.name === 'light'
      ? require('../../../img/onboarding.png')
      : require('../../../img/onboarding-dark.png');

  return (
    <View style={{backgroundColor: theme.grayBackground, flex: 1}}>
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

        <TouchableOpacity onPress={() => props.onDidPressAddSite()}>
          <Text
            style={{
              ...styles.addSiteButtonText,
              backgroundColor: theme.blueCallToAction,
              color: theme.buttonTextColor,
            }}>
            {i18n.t('add_first_site')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

OnBoardingView.propTypes = {
  onDidPressAddSite: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  illustrationContainer: {
    marginTop: 100,
    height: '40%',
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
    fontSize: 18,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 18,
  },
  addSiteButtonText: {
    fontSize: 20,
    fontWeight: '500',
    padding: 16,
    textAlign: 'center',
  },
});

export default OnBoardingView;
