import { AppRegistry } from 'react-native';
import { getStorybookUI, configure } from '@kadira/react-native-storybook';

configure(() => {
  require('./stories/home_page_story');
  require('./stories/home_header_story');
  require('./stories/site_row_story');
}, module);

const StorybookUI = getStorybookUI({port: 9001, host: 'localhost'});
AppRegistry.registerComponent('Discourse', () => StorybookUI);
