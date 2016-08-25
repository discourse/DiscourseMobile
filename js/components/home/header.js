/**
 * @flow
 */

import React, {
  Component,
  PropTypes
} from 'react';

import {
  Image,
  LayoutAnimation,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

class HomeHeader extends Component {
  static propTypes = {
    onDidSubmitTerm: PropTypes.func.isRequired,
    lastRefreshTime: PropTypes.string
  }

  renderRightButton() {
    if(this.state.expanded) {
      return <TouchableOpacity onPress={()=>this.hideTermInput()}>
        <Text style={styles.rightButton}>Cancel</Text>
      </TouchableOpacity>;
    } else {
      return <TouchableOpacity onPress={()=>this.showTermInput()}>
        <Text style={styles.rightButton}>Add</Text>
      </TouchableOpacity>;
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      text: "",
      expanded: false
    };
  }

  componentWillMount() {
    LayoutAnimation.spring();
  }

  hideTermInput() {
    this.refs.Input.blur();
    LayoutAnimation.spring();
    this.setState({expanded: false});
  }

  showTermInput() {
    this.refs.Input.focus();
    LayoutAnimation.spring();
    this.setState({expanded: true});
  }

  handleSubmitTerm(term) {
    this.hideTermInput();
    this.setState({text: ""});
    this.props.onDidSubmitTerm(term);
  }

  termStyle() {
    return {
      flex:1,
      marginTop: 6,
      marginBottom: 6,
      marginLeft: 12,
      marginRight: 12,
      height: this.state.expanded ? 36 : 0
    };
  }

  termContainerStyle() {
    return {
      backgroundColor: '#e9e9e9',
      height: this.state.expanded ? 48 : 0
    };
  }

  renderLastUpdate() {
    if (this.props.lastRefreshTime && this.props.lastRefreshTime.length > 0) {
      return (
        <View style={styles.leftContainer}>
          <Text style={styles.lastUpdatedTextTitle}>Last updated</Text>
          <Text style={styles.lastUpdatedTextSubtitle}>
            {this.props.lastRefreshTime}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.leftContainer}></View>
      );
    }
  }

  render() {
    return (
      <View>
        <View style={styles.header}>

          {this.renderLastUpdate()}

          <Image style={styles.icon} source={require('../../../img/nav-icon-gray.png')} />

          <View style={styles.rightContainer}>
            {this.renderRightButton()}
          </View>
        </View>
        <View style={this.termContainerStyle()}>
          <TextInput
            ref='Input'
            clearButtonMode='while-editing'
            autoCapitalize='none'
            autoCorrect={false}
            onSubmitEditing={(event)=>this.handleSubmitTerm(event.nativeEvent.text)}
            placeholder="meta.discourse.org"
            style={this.termStyle()}
            onChangeText={(text) => this.setState({text})}
            value={this.state.text}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 25,
    paddingBottom: 10,
    backgroundColor: '#f3f3f3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  icon: {
    resizeMode: 'contain',
    height: 40
  },
  leftContainer: {
    flex: 2,
    marginLeft: 5
  },
  lastUpdatedTextTitle: {
    color: '#9c9b9d',
    fontWeight: "600",
    fontSize: 12
  },
  lastUpdatedTextSubtitle: {
    color: '#9c9b9d',
    fontSize: 12
  },
  rightContainer: {
    flex: 2,
    marginRight: 5,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  rightButton: {
    backgroundColor: '#666',
    padding: 8,
    borderRadius: 2,
    fontWeight: "700",
    fontSize: 14,
    textAlign: 'center',
    color: 'white'
  }
});

export default HomeHeader;
