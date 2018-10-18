import React from "react";
import {
  Alert,
  SafeAreaView,
  Modal,
  TouchableHighlight,
  View,
  Text
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import style from "./stylesheet";
import { material } from "react-native-typography";
import SortableListView from "react-native-sortable-listview";
import Site from "Models/site";
import Colors from "Root/colors";
import EditSiteRowComponent from "Components/edit-site-row";

export default class extends React.Component {
  constructor(props) {
    super(props);
    // this.sites = props.siteManager.toObject();
  }

  _onRemoveSite(site) {
    Alert.alert(site.title, "Are you sure you want to remove this site?", [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: () => this.props.siteManager.remove(site) }
    ]);
  }

  render() {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={this.props.visible}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={style.wrapper}>
            <View style={style.header}>
              <Text style={[material.title, style.title]}>Edit sites</Text>

              <TouchableHighlight
                onPress={() => this.props.onClose()}
                style={style.closeModalButton}
              >
                <Text style={[material.button, style.closeModalButtonText]}>
                  OK
                </Text>
              </TouchableHighlight>
            </View>

            <SortableListView
              style={{ flex: 1 }}
              order={Object.keys(this.props.siteManager.sites)}
              scrollEnabled={false}
              enableEmptySections={true}
              activeOpacity={0.5}
              data={this.props.siteManager.sites}
              disableAnimatedScrolling={true}
              disableSorting={false}
              onRowMoved={e => {
                this.props.siteManager.updateOrder(e.from, e.to);
                this.forceUpdate();
              }}
              rowHasChanged={(r1, r2) => {
                // TODO: r2 returns as an Object instead of a Site
                // casting Site shouldn't be needed
                return new Site(r1).toJSON() !== new Site(r2).toJSON();
              }}
              renderRow={site => (
                <EditSiteRowComponent
                  onRemoveSite={this._onRemoveSite.bind(this, site)}
                  site={site}
                />
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  }
}
