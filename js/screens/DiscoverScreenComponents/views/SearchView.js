/* @flow */
'use strict';

import React, { useContext } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import i18n from 'i18n-js';

import { ThemeContext } from '../../../ThemeContext';
import sharedStyles from './styles';

const SearchView = props => {
  const theme = useContext(ThemeContext);
  const {
    term,
    results,
    loading,
    selectionCount,
    tabBarHeight,
    listRef,
    onResetToSplash,
    onRefresh,
    onEndReached,
    renderSearchBox,
    renderSiteItem,
  } = props;

  const messageText =
    term.length === 1
      ? i18n.t('discover_no_results_one_character')
      : i18n.t('discover_no_results');

  const emptyResult = (
    <ScrollView keyboardShouldPersistTaps="handled">
      {loading ? (
        <View style={sharedStyles.emptyResult}>
          <ActivityIndicator size="large" color={theme.grayUI} />
        </View>
      ) : (
        <View>
          <Text style={{ ...styles.desc, color: theme.grayTitle }}>
            {messageText}
          </Text>
          <TouchableHighlight
            style={styles.noResultsReset}
            underlayColor={theme.background}
            onPress={() => onResetToSplash()}
          >
            <Text
              style={{
                color: theme.blueUnread,
                fontSize: 16,
              }}
            >
              {i18n.t('discover_reset')}
            </Text>
          </TouchableHighlight>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={sharedStyles.container}>
      {renderSearchBox()}
      <FlatList
        keyboardDismissMode="on-drag"
        keyExtractor={item => String(item.id || item.featured_link)}
        ListEmptyComponent={emptyResult}
        ref={listRef}
        contentContainerStyle={{ paddingBottom: tabBarHeight }}
        data={results}
        refreshing={loading}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => onRefresh()} />
        }
        renderItem={({ item }) => renderSiteItem({ item })}
        onEndReached={() => onEndReached()}
        extraData={selectionCount}
        maxToRenderPerBatch={20}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  desc: {
    fontSize: 16,
    padding: 24,
    textAlign: 'center',
  },
  noResultsReset: {
    padding: 6,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 40,
  },
});

export default SearchView;
