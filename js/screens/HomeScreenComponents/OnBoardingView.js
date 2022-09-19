/* @flow */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import i18n from 'i18n-js';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ThemeContext} from '../../ThemeContext';

class OnBoardingView extends React.Component {
  static propTypes = {
    onDidPressAddSite: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const theme = this.context;
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
          <Text style={styles.text}>
            <Text style={{...styles.title, color: theme.grayTitle}}>
              {i18n.t('no_sites_yet')}
            </Text>
            {'\n'}
            <Text style={{color: theme.graySubtitle}}>
              {i18n.t('add_sites')}
            </Text>
          </Text>

          <TouchableOpacity onPress={() => this.props.onDidPressAddSite()}>
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
  }
}

OnBoardingView.contextType = ThemeContext;

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    padding: 32,
    textAlign: 'center',
  },
  addSiteButtonText: {
    fontSize: 20,
    fontWeight: '500',
    padding: 16,
    textAlign: 'center',
  },
  title: {
    fontWeight: '500',
  },
  addSiteContainer: {
    marginTop: 32,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  illustrationContainer: {
    marginTop: 100,
    height: '40%',
    width: '100%',
  },
});

export default OnBoardingView;
