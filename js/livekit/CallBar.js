/* @flow */
'use strict';

import React, { useContext, useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import i18n from 'i18n-js';
import { ThemeContext } from '../ThemeContext';
import bridge from './bridge';

const ACTIVE_STATES = ['connecting', 'connected', 'reconnecting'];

// Floating pill shown while a native LiveKit call is active. Rendered at the
// app root so the call stays visible (and controllable) when the user closes
// the webview or switches screens.
const CallBar = () => {
  const theme = useContext(ThemeContext);
  const [call, setCall] = useState(() => bridge.snapshot());

  useEffect(() => bridge.subscribe(setCall), []);

  if (Platform.OS !== 'ios' || !ACTIVE_STATES.includes(call.state)) {
    return null;
  }

  const label =
    call.state === 'connected'
      ? call.roomName || i18n.t('call_in_progress')
      : i18n.t('call_connecting');

  return (
    <View
      style={{
        ...styles.bar,
        backgroundColor: theme.background,
        borderColor: theme.grayBorder,
      }}
    >
      <FontAwesome5
        name="volume-up"
        size={14}
        color={theme.blueCallToAction}
        iconStyle="solid"
      />
      <Text
        numberOfLines={1}
        style={{ ...styles.label, color: theme.grayTitle }}
      >
        {label}
      </Text>
      <TouchableOpacity
        accessibilityLabel={
          call.micEnabled ? i18n.t('call_mute') : i18n.t('call_unmute')
        }
        style={styles.button}
        onPress={() => bridge.setMicrophone(!call.micEnabled)}
      >
        <FontAwesome5
          name={call.micEnabled ? 'microphone' : 'microphone-slash'}
          size={16}
          color={call.micEnabled ? theme.grayUI : theme.redDanger}
          iconStyle="solid"
        />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel={i18n.t('call_leave')}
        style={styles.button}
        onPress={() => bridge.disconnect()}
      >
        <FontAwesome5
          name="phone-slash"
          size={16}
          color={theme.redDanger}
          iconStyle="solid"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '90%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 10,
    elevation: 6,
  },
  label: {
    flexShrink: 1,
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
});

export default CallBar;
