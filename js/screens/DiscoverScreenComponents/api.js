/* @flow */
'use strict';

import Site from '../../site';
import fetch from '../../../lib/fetch';

const SEARCH_BASE_URL = `${Site.discoverUrl()}search.json?q=`;

export function fetchSplashTags() {
  const url = `${Site.discoverUrl()}discover/hot-topics-tags.json`;
  return fetch(url).then(res => res.json());
}

export function fetchHotTopics(tag, page = 1) {
  const url = `${Site.discoverUrl()}discover/hot-topics.json?tag=${encodeURIComponent(
    tag,
  )}&page=${page}`;
  return fetch(url).then(res => res.json());
}

export function fetchTagCommunities(tag) {
  const searchString = `#discover #${tag} order:featured`;
  const url = `${SEARCH_BASE_URL}${encodeURIComponent(searchString)}&page=1`;
  return fetch(url).then(res => res.json());
}

export function fetchCommunityHotTopics(communityUrl, page = 0) {
  const url = `${communityUrl}/hot.json?page=${page}`;
  return fetch(url).then(res => res.json());
}

export function searchDiscover(term, page = 1) {
  const defaultSearch = '#locale-en';
  const searchTerm = term === '' ? defaultSearch : term;
  const order = term.startsWith('order:') ? '' : 'order:featured';
  const searchString = `#discover ${searchTerm} ${order}`;
  const url = `${SEARCH_BASE_URL}${encodeURIComponent(
    searchString,
  )}&page=${page}`;
  return fetch(url).then(res => res.json());
}

export function fetchAllCommunities(filter) {
  let searchString;
  if (filter === 'recent') {
    searchString = '#discover order:latest_topic';
  } else if (filter) {
    searchString = `#discover #${filter} order:featured`;
  } else {
    searchString = '#discover order:featured';
  }
  const url = `${SEARCH_BASE_URL}${encodeURIComponent(searchString)}&page=1`;
  return fetch(url).then(res => res.json());
}
