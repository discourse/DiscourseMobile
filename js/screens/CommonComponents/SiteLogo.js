/* @flow */
'use strict';

import { useContext } from 'react';
import { Image, Text, View } from 'react-native';
import { ThemeContext } from '../../ThemeContext';

export function isValidLogoUrl(url) {
  return url && !url.endsWith('.webp') && !url.endsWith('.svg');
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

const SiteLogo = ({
  logoImage,
  title,
  size = 42,
  borderRadius = 10,
  style,
}) => {
  const theme = useContext(ThemeContext);
  const fontSize = Math.round(size * 0.62);

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

  if (logoImage === false) {
    return (
      <View
        style={[
          {
            alignSelf: 'flex-start',
            justifyContent: 'center',
            alignItems: 'center',
            height: size,
            width: size,
            marginTop: 2,
            borderRadius,
            marginHorizontal: 4,
            backgroundColor: pickColor(title),
          },
          style,
        ]}
      >
        <Text
          style={{
            color: pickColor(title, true),
            fontSize,
            fontWeight: '700',
          }}
        >
          {title[0]}
        </Text>
      </View>
    );
  }

  return (
    <Image
      style={[
        {
          alignSelf: 'flex-start',
          height: size,
          width: size,
          marginTop: 2,
          borderRadius,
          marginHorizontal: 4,
        },
        style,
      ]}
      source={logoImage}
      resizeMode="contain"
    />
  );
};

export default SiteLogo;
