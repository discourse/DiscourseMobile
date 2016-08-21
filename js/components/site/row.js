/**
 * @flow
 */

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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

  renderCounts(site) {
    var counts = [];
    if (site.authToken) {
      if (site.totalNew > 0) {
        counts.push("new (" + site.totalNew + ")");
      }
      if (site.totalUnread > 0) {
        counts.push("unread (" + site.totalUnread + ")");
      }
    }

    if (counts.length > 0) {
      return (
        <View style={styles.counts}>
          <Text style={styles.countsText}>{counts.join('  ')}</Text>
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
                    backgroundColor: '#ee512a',
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
                  numberOfLines={2}
                  style={styles.description}>
                {site.description}
              </Text>
              {this.renderCounts(site)}
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
    padding: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  icon: {
    width: 40,
    height: 40,
    alignSelf: 'center'
  },
  info: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
    paddingLeft: 12
  },
  url: {
    fontSize: 14,
    color: "black",
    fontWeight: "500"
  },
  description: {
    fontSize: 14,
    color: "#999",
    flex: 10
  },
  notifications: {
    paddingLeft: 12,
    flexDirection: 'row',
    backgroundColor: 'white'
  },
  connect: {
    alignSelf: 'flex-start',
    backgroundColor: "#499",
    padding: 6,
    marginLeft: 6,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 'bold',
    borderRadius: 2,
    color: "#FFF",
    overflow: 'hidden'
  },
  blueNotification: {
    alignSelf: 'flex-start',
    backgroundColor: "#6CF",
    padding: 6,
    marginLeft: 6,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 'bold',
    borderRadius: 8,
    color: "#FFF"
  },
  greenNotification: {
    alignSelf: 'flex-start',
    backgroundColor: "#01a84c",
    padding: 8,
    marginLeft: 6,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 'bold',
    borderRadius: 2,
    color: "#FFF"
  },
  counts: {
    marginTop: 6
  },
  countsText: {
    fontSize: 12,
    color: '#999'
  }
});

export default Row;
