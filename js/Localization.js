import i18n from 'i18n-js';
import * as RNLocalize from 'react-native-localize';

i18n.translations = {
  en: {
    add_first_site: '+ Add your first site',
    add_site: 'Add Site',
    add_sites: 'Add Discourse sites to keep track of.',
    add: '+ Add',
    all: 'All',
    and: 'and',
    approved_commits: '%{count} commits approved',
    approved: '"%{title}" approved',
    check_out_popular: 'Check out these popular communities.',
    connect: 'connect',
    dont_know_where_to_start: 'Don’t know where to start?',
    inbox_message:
      '%{inbox_count} %{message_count} in your %{group_name} inbox',
    incorrect_url:
      'Sorry, %{term} is not a correct URL to a Discourse forum or does not support mobile APIs, have owner upgrade Discourse to latest!',
    liked: 'liked %{count} of your posts',
    membership_accepted: 'Membership accepted in "%{name}"',
    message: 'message',
    messages: 'messages',
    new_with_count: 'new (%{count})',
    new: 'New',
    no_notifications: 'No notifications.',
    no_replies: 'No replies.',
    no_sites_yet: 'You don’t have any sites yet.',
    non_new_notifications: 'No new notifications.',
    not_found: '%{term} was not found!',
    notifications: 'Notifications',
    other: 'other',
    others: 'others',
    replies: 'Replies',
    term_exists: '%{term} already exists',
    unread_with_count: 'unread (%{count})',
  },
  fr: {
    add_first_site: '+ Ajoutez le premier site',
    add_sites: 'Add Discourse sites to keep track of.',
    add: '+ Ajoutez',
    check_out_popular: 'Essayez ces communautés populaires.',
    dont_know_where_to_start: 'Vous ne savez pas par où commencer?',
    no_sites_yet: 'Vous n’avez aucun site.',
  },
  it: {
    add_first_site: '+ Add your first site',
    add_site: 'Agguingi sito',
    add_sites: 'Add Discourse sites to keep track of.',
    add: '+ Aggiungi',
    all: 'Tutti',
    and: 'e',
    check_out_popular: 'Check out these popular communities.',
    connect: 'connetti',
    dont_know_where_to_start: 'Don’t know where to start?',
    incorrect_url:
      'Sorry, %{term} is not a correct URL to a Discourse forum or does not support mobile APIs, have owner upgrade Discourse to latest!',
    message: 'messaggio',
    messages: 'messaggi',
    new_with_count: 'nuovi (%{count})',
    new: 'Nuovi',
    no_notifications: 'Non hai ancora notifiche.',
    no_replies: 'Ancora nessuna risposta.',
    no_sites_yet: 'You don’t have any sites yet.',
    non_new_notifications: 'Non hai nuove notifiche.',
    not_found: 'Spiacenti, %{term} non esiste.',
    notifications: 'Notifiche',
    other: 'altro',
    others: 'altri',
    replies: 'Risposte',
    term_exists: '%{term} esiste già',
    unread_with_count: 'non letti (%{count})',
  },
};

const {languageTag, isRTL} = RNLocalize.findBestAvailableLanguage(
  Object.keys(i18n.translations),
) || {languageTag: 'en-US', isRTL: false};

i18n.locale = languageTag;
i18n.fallbacks = true;

export default function (string, params = {}) {
  return i18n.t(string, params);
}
