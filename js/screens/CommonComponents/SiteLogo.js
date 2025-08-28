/* @flow */
'use strict';

import {useContext} from 'react';
import {Image, Text, View} from 'react-native';
import {ThemeContext} from '../../ThemeContext';

const SiteLogo = props => {
  const theme = useContext(ThemeContext);

  function hashCode(str) {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  function pickColor(str, text = false) {
    const darkMode = theme.name === 'dark';

    let s = darkMode ? 30 : 50;
    let l = darkMode ? 20 : 60;

    if (text) {
      s = s + 20;
      l = l + 30;
    }
    return `hsl(${hashCode(str) % 360}, ${s}%, ${l}%)`;
  }

  if (props.logoImage === false) {
    // Generate a placeholder icon in lieu of a logo from the site's first initial character
    return (
      <View
        style={{
          alignSelf: 'flex-start',
          justifyContent: 'center',
          alignItems: 'center',
          height: 40,
          width: 40,
          marginTop: 2,
          borderRadius: 10,
          marginHorizontal: 4,
          backgroundColor: pickColor(props.title),
        }}>
        <Text
          style={{
            color: pickColor(props.title, true),
            fontSize: 20,
            fontWeight: '800',
          }}>
          {props.title[0]}
        </Text>
      </View>
    );
  }

  return (
    <Image
      style={{
        alignSelf: 'flex-start',
        height: 40,
        width: 40,
        marginTop: 2,
        borderRadius: 10,
        marginHorizontal: 4,
      }}
      source={props.logoImage}
      resizeMode="contain"
    />
  );
};

export default SiteLogo;
