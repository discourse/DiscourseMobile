/* @flow */
'use strict';

import React from 'react';
import { Linking, Platform } from 'react-native';
import { BaseToast } from 'react-native-toast-message';

export const VIEWS = {
  SPLASH: 'splash',
  SEARCH: 'search',
  TAG_DETAIL: 'tagDetail',
  ALL_COMMUNITIES: 'allCommunities',
  COMMUNITY_DETAIL: 'communityDetail',
};

export const defaultView = VIEWS.SPLASH;

export const FALLBACK_TAGS = [
  'ai',
  'finance',
  'apple',
  'automation',
  'media',
  'research',
  'smart-home',
  'linux',
  'open-source',
  'webdev',
  'health',
  'gaming',
  'audio',
  'programming-language',
  'devops',
  'crypto',
  'mapping',
];

export const toastConfig = {
  success: props => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: 'transparent' }}
      onPress={() => {
        if (Platform.OS === 'android') {
          Linking.openSettings();
        }
        if (Platform.OS === 'ios') {
          Linking.openURL('App-Prefs:NOTIFICATIONS_ID');
        }
      }}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      text1Style={{
        fontSize: 17,
        fontWeight: '400',
      }}
      text2Style={{
        fontSize: 17,
      }}
    />
  ),
};
