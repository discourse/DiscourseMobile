/**
 * @format
 */

import {AppRegistry, Platform} from 'react-native';
import Discourse from './js/Discourse';
import bgMessaging from './js/firebase/bgMessaging';

AppRegistry.registerComponent('Discourse', () => Discourse);

if (Platform.OS === 'android') {
  AppRegistry.registerHeadlessTask(
    'RNFirebaseBackgroundMessage',
    () => bgMessaging,
  );
}
