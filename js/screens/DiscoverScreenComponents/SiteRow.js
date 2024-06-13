/* @flow */
'use strict';

import React, {useContext} from 'react';
import {Image, StyleSheet, Text, TouchableHighlight, View} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {ThemeContext} from '../../ThemeContext';
import {decode} from 'html-entities';
import i18n from 'i18n-js';

const SiteRow = props => {
  const theme = useContext(ThemeContext);

  const iconUrl = props.site.discover_entry_logo_url;

  // When dominant color is white on light or black on dark
  // add a background color to the icon
  const dominantColor = props.site.discover_entry_logo_dominant_color;
  let iconBgColor = 'transparent';
  if (theme.name === 'dark' && dominantColor === '000000') {
    iconBgColor = '#FFFFFF';
  }

  if (theme.name === 'light' && dominantColor === 'FFFFFF') {
    iconBgColor = '#333333';
  }

  const iconPath =
    iconUrl && !iconUrl.endsWith('.webp') && !iconUrl.endsWith('.svg')
      ? {uri: iconUrl}
      : require('../../../img/nav-icon-gray.png');

  const siteAddIcon = props.inLocalList ? 'check' : 'plus';
  const siteAddColor = props.inLocalList
    ? theme.greenPrivateUnread
    : theme.blueCallToAction;

  let activeUserCount = null;

  if (props.site.active_users_30_days) {
    const roundedCount = i18n.toNumber(props.site.active_users_30_days || 0, {
      precision: 0,
    });

    activeUserCount = (
      <Text style={{...styles.description, color: theme.graySubtitle}}>
        {i18n.t('active_counts', {
          active_users: roundedCount,
        })}
      </Text>
    );
  }

  return (
    <TouchableHighlight
      style={{...styles.container, backgroundColor: theme.background}}
      underlayColor={theme.yellowUIFeedback}
      onPress={() => props.loadSite(props.site.featured_link)}>
      <View style={{...styles.row, borderBottomColor: theme.grayBorder}}>
        <View style={styles.iconWrapper}>
          <Image
            style={{...styles.icon, backgroundColor: iconBgColor}}
            source={iconPath}
            resizeMode="contain"
          />
        </View>
        <View style={styles.info}>
          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={{...styles.url, color: theme.grayTitle}}>
            {props.site.title}
          </Text>
          {activeUserCount}
          <Text
            ellipsizeMode="tail"
            numberOfLines={4}
            style={{...styles.description, color: theme.graySubtitle}}>
            {decode(props.site.excerpt)}
          </Text>
        </View>
        <View style={{paddingHorizontal: 8, justifyContent: 'center'}}>
          <TouchableHighlight
            style={styles.buttonWrapper}
            underlayColor={theme.background}
            onPress={() =>
              !props.inLocalList &&
              props.handleSiteAdd(props.site.featured_link)
            }
            {...props.sortHandlers}>
            <View
              style={{
                ...styles.button,
                backgroundColor: siteAddColor,
              }}>
              <FontAwesome5
                name={siteAddIcon}
                size={16}
                color={theme.buttonTextColor}
              />
            </View>
          </TouchableHighlight>
        </View>
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 12,
    paddingRight: 0,
  },
  iconWrapper: {
    alignSelf: 'flex-start',
    width: 40,
    minHeight: 40,
    marginHorizontal: 4,
  },
  icon: {
    alignSelf: 'flex-start',
    width: 40,
    minHeight: 40,
    marginTop: 3,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  url: {
    fontSize: 16,
    fontWeight: 'normal',
    paddingLeft: 6,
  },
  description: {
    flex: 10,
    fontSize: 14,
    paddingLeft: 6,
    paddingTop: 6,
  },
  buttonWrapper: {
    borderRadius: 30,
    padding: 10,
  },
  button: {
    padding: 10,
    borderRadius: 20,
    width: 35,
  },
});

export default SiteRow;
