/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {registerGlobals} from '@livekit/react-native';
import Discourse from './js/Discourse';

// installs WebRTC globals used by livekit-client (js/livekit/bridge.js)
registerGlobals();

AppRegistry.registerComponent('Discourse', () => Discourse);
