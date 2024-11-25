/* @flow */
'use strict';

import React, {useContext} from 'react';

import {
  Dimensions,
  Linking,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from 'react-native';
import i18n from 'i18n-js';
import {ThemeContext} from '../../ThemeContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const TermBar = props => {
  const theme = useContext(ThemeContext);
  const discoverHelpUrl = 'https://discover.discourse.org/?faq';

  const largeLayout = Dimensions.get('window').width > 600;

  const infoIcon = props.addSiteScreenParent ? null : (
    <TouchableHighlight
      style={styles.question}
      underlayColor={theme.background}
      onPress={() => Linking.openURL(discoverHelpUrl)}>
      <FontAwesome5
        name={'info-circle'}
        size={16}
        style={{color: theme.graySubtitle}}
      />
    </TouchableHighlight>
  );

  const searchCancel = (
    <TouchableHighlight
      underlayColor={theme.background}
      onPress={() => {
        props.handleChangeText('');
        Keyboard.dismiss();
      }}>
      <Text style={{color: theme.blueUnread}}>{i18n.t('clear')}</Text>
    </TouchableHighlight>
  );

  return (
    <View
      style={{
        ...styles.container,
        paddingTop: largeLayout ? 20 : 6,
        paddingBottom: largeLayout ? 10 : 0,
      }}>
      <View style={styles.leftContainer}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.grayBackground,
            borderRadius: 10,
            marginHorizontal: 8,
          }}>
          <View
            style={{
              paddingHorizontal: 12,
            }}>
            <FontAwesome5 name={'search'} size={14} color={theme.grayUI} />
          </View>
          <TextInput
            enterKeyHint="search"
            keyboardType="url"
            clearButtonMode="never"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={'off'}
            autoFocus={props.addSiteScreenParent}
            placeholder={
              props.addSiteScreenParent
                ? i18n.t('term_placeholder_single_site')
                : i18n.t('term_placeholder')
            }
            placeholderTextColor={theme.graySubtitle}
            style={[
              styles.term,
              {color: theme.grayTitle, fontSize: largeLayout ? 18 : 16},
            ]}
            onChangeText={newText => props.handleChangeText(newText)}
            underlineColorAndroid={'transparent'}
            value={props.text}
            testID="search-add-input"
          />
        </View>
        {props.text ? searchCancel : infoIcon}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  term: {
    flex: 1,
    paddingVertical: 8,
  },
  container: {
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 42,
    marginHorizontal: 8,
    marginBottom: 14,
  },
  leftContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    paddingHorizontal: 6,
  },
});

export default TermBar;
