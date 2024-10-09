/* @flow */
'use strict';

import React from 'react';
import Components from './WebViewScreenComponents';

class WebViewScreen extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Components.WebViewComponent
        {...this.props}
        url={this.props.route.params.url}
      />
    );
  }
}

export default WebViewScreen;
