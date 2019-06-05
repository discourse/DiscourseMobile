/**
 * @format
 */

import { AppRegistry } from "react-native";

import Discourse from "./js/Discourse";
import bgMessaging from './js/bgMessagingAndroid';

AppRegistry.registerComponent("Discourse", () => Discourse);
AppRegistry.registerHeadlessTask('RNFirebaseBackgroundMessage', () => bgMessaging);