'use strict';

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity
} from 'react-native';

import Swipeout from 'react-native-swipeout';

class Row extends React.Component {

  renderUnread(site) {
    if (site.unreadNotifications) {
      return (
          <Text style={styles.blueNotification}>{site.unreadNotifications}</Text>
      );
    }
  }

  renderUnreadPM(site) {
    if (site.unreadPrivateMessages) {
      return (
          <Text style={styles.greenNotification}>{site.unreadPrivateMessages}</Text>
      );
    }
  }

  renderNotifications(site) {
    if (site.authToken && (site.unreadNotifications || site.unreadPrivateMessages )) {
      return (
        <View style={styles.notifications}>
          {this.renderUnreadPM(site)}
          {this.renderUnread(site)}
        </View>
      );
    }
  }

  renderShouldLogin(site) {
    if (!site.authToken) {
      return (
        <View style={styles.notifications}>
          <Text style={styles.connect}>connect</Text>
        </View>
      );
    }
  }

  render() {
    const site = this.props.site;

    return (
      <Swipeout
                backgroundColor={'#FFF'}
                right={[{
                    text: 'Remove',
                    backgroundColor: '#A22',
                    onPress: this.props.onDelete
                }]}>
        <TouchableOpacity onPress={()=>this.props.onClick()}>
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
            {this.renderShouldLogin(site)}
            {this.renderNotifications(site)}
          </View>
        </TouchableOpacity>
      </Swipeout>
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
    paddingLeft: 5,
    flexDirection: 'row',
  },
  connect: {
    justifyContent: 'flex-end',
    backgroundColor: "#499",
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 6,
    fontSize: 13,
    fontWeight: 'bold',
    borderRadius: 2,
    color: "#FFF",
    height: 20
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
    marginLeft: 5,
    height: 20
  },
  greenNotification: {
    justifyContent: 'flex-end',
    backgroundColor: "#00a651",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
    fontSize: 11,
    fontWeight: 'bold',
    borderRadius: 8,
    color: "#FFF",
    height: 20
  },
});

export default Row;
