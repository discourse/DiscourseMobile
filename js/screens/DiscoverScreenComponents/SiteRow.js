/* @flow */
'use strict';

import { useContext } from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import { ThemeContext } from '../../ThemeContext';
import { decode } from 'html-entities';
import i18n from 'i18n-js';
import SiteLogo from '../CommonComponents/SiteLogo';

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

  let logoImage =
    iconUrl && !iconUrl.endsWith('.webp') && !iconUrl.endsWith('.svg')
      ? { uri: iconUrl }
      : false;

  const siteAddIcon = props.inLocalList ? 'check' : 'plus';
  const siteAddColor = props.inLocalList
    ? theme.greenPrivateUnread
    : theme.blueCallToAction;
  const siteAddIconA11YLabel = props.inLocalList
    ? i18n.t('added_to_home_screen')
    : i18n.t('add_to_home_screen');

  let activeUserCount = null;

  if (props.site.active_users_30_days) {
    const roundedCount = i18n.toNumber(props.site.active_users_30_days || 0, {
      precision: 0,
    });

    activeUserCount = (
      <Text style={{ ...styles.description, color: theme.graySubtitle }}>
        {i18n.t('active_counts', {
          active_users: roundedCount,
        })}
      </Text>
    );
  }

  const link = props.site.featured_link || props.site.url;

  return (
    <View style={{ ...styles.container, backgroundColor: theme.background }}>
      <View style={{ ...styles.row, borderBottomColor: theme.grayBorder }}>
        <TouchableHighlight
          style={{ flex: 1, backgroundColor: theme.background }}
          underlayColor={'transparent'}
          onPress={() => props.loadSite(props.site.featured_link)}
        >
          <View style={{ flexDirection: 'row' }}>
            <View style={styles.iconWrapper}>
              <SiteLogo logoImage={logoImage} title={props.site.title} />
            </View>
            <View style={styles.info}>
              <Text
                ellipsizeMode="tail"
                numberOfLines={1}
                style={{ ...styles.url, color: theme.grayTitle }}
              >
                {props.site.title}
              </Text>
              {activeUserCount}
              {props.site.excerpt && (
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={5}
                  style={{ ...styles.description, color: theme.graySubtitle }}
                >
                  {decode(props.site.excerpt)}
                </Text>
              )}
              {link && (
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={{ ...styles.secondaryUrl, color: theme.graySubtitle }}
                >
                  {link.replace(/^https?:\/\//, '')}
                </Text>
              )}
            </View>
          </View>
        </TouchableHighlight>
        <View
          style={{ paddingHorizontal: 8, justifyContent: 'center' }}
          importantForAccessibility="yes"
        >
          <TouchableHighlight
            accessible={true}
            accessibilityLabel={siteAddIconA11YLabel}
            style={styles.buttonWrapper}
            underlayColor={theme.background}
            testID="add-site-icon"
            onPress={() =>
              !props.inLocalList &&
              props.handleSiteAdd(props.site.featured_link)
            }
            {...props.sortHandlers}
          >
            <View
              style={{
                ...styles.button,
                backgroundColor: siteAddColor,
              }}
            >
              <FontAwesome5
                name={siteAddIcon}
                size={16}
                color={theme.buttonTextColor}
                iconStyle="solid"
              />
            </View>
          </TouchableHighlight>
        </View>
      </View>
    </View>
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
  secondaryUrl: {
    fontSize: 14,
    paddingTop: 6,
    paddingLeft: 6,
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
