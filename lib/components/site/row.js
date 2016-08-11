'use strict';

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image
} from 'react-native';

class Row extends React.Component {
  renderNotifications(site) {
    if(site.unreadNotifications) {
      return (
        <View style={styles.notifications}>
          <Text style={styles.blueNotification}>{site.unreadNotifications}</Text>
        </View>
      );
    }
  }

  render() {
    const site = this.props.site;

    return (
      <View accessibilityTraits="link" style={styles.row}>
        <Image style={styles.icon} source={{uri: site.icon}} />
        <View style={styles.info}>
          <Text
              ellipsizeMode='tail'
              numberOfLines={1}
              style={styles.url}>
            {site.url}
          </Text>
          <Text
              ellipsizeMode='tail'
              numberOfLines={1}
              style={styles.description}>
            {site.description}
          </Text>
        </View>
        {this.renderNotifications(site)}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    paddingBottom: 20,
    marginBottom: 21,
    borderBottomColor: '#ddd',
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  icon: {
    width: 40,
    height: 40,
  },
  info: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
    paddingLeft: 5
  },
  description: {
    fontSize: 12,
    color: "#999",
    flex: 10
  },
  notifications: {
    paddingLeft: 5
  },
  blueNotification: {
    justifyContent: 'flex-end',
    backgroundColor: "#6CF",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
    fontSize: 11,
    fontWeight: 'bold',
    borderRadius: 8,
    color: "#FFF",
  },
  greenNotification: {
    color: "#FFF"
  },
});

export default Row;
