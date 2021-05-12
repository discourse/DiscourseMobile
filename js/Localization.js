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
    inbox_message: '%{inbox_count} %{messages} in your %{group_name} inbox',
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
    no_new_notifications: 'No new notifications.',
    not_found: '%{term} was not found!',
    notifications: 'Notifications',
    other: 'other',
    others: 'others',
    replies: 'Replies',
    term_exists: '%{term} already exists',
    unread_with_count: 'unread (%{count})',
  },
  fr: {
    add_first_site: '+ Ajoutez votre premier site',
    add_site: 'Ajoutez un site',
    add_sites: 'Ajoutez des sites à suivre.',
    add: '+ Ajoutez',
    all: 'Tout',
    and: 'et',
    approved_commits: '%{count} commits approuvés',
    approved: '"%{title}" approuvé',
    check_out_popular: 'Essayez ces communautés populaires.',
    connect: 'connecter',
    dont_know_where_to_start: 'Vous ne savez pas par où commencer?',
    inbox_message: '%{inbox_count} %{messages} dans %{group_name}',
    incorrect_url:
      'Sorry, %{term} is not a correct URL to a Discourse forum or does not support mobile APIs, have owner upgrade Discourse to latest!',
    liked: 'a aimé %{count} de vos messages',
    membership_accepted: 'Adhésion acceptée dans « %{name} »',
    message: 'message',
    messages: 'messages',
    new_with_count: 'nouveaux (%{count})',
    new: 'Nouveaux',
    no_notifications: 'Pas de notifications.',
    no_replies: 'Pas de réponses.',
    no_sites_yet: 'Vous n’avez aucun site.',
    no_new_notifications: 'Pas de nouvelles notifications.',
    not_found: 'Désolé, %{term} n’existe pas.',
    notifications: 'Notifications',
    other: 'autre',
    others: 'autres',
    replies: 'Réponses',
    term_exists: '%{term} existe déjà',
    unread_with_count: 'non lus (%{count})',
  },
  it: {
    add_first_site: '+ Aggiungi il tuo primo sito',
    add_site: 'Aggiungi sito',
    add_sites: 'Aggiungi siti Discourse da seguire.',
    add: '+ Aggiungi',
    all: 'Tutti',
    and: 'e',
    approved_commits: '%{count} commit approvati',
    approved: '"%{title}" approvato',
    check_out_popular: 'Dai un’occhiata a queste comunità popolari.',
    connect: 'connetti',
    dont_know_where_to_start: 'Non sai da dove cominciare?',
    incorrect_url:
      'Spiacenti, %{term} non è l’URL corretto di un forum Discourse o non supporta le API mobile, chiedi al proprietario di aggiornare Discourse alla versione più recente!',
    liked: 'ha messo "mi piace" a %{count} dei tuoi messaggi',
    membership_accepted: 'Iscrizione accettata in "%{name}"',
    message: 'messaggio',
    messages: 'messaggi',
    new_with_count: 'nuovi (%{count})',
    new: 'Nuovi',
    no_notifications: 'Non hai ancora notifiche.',
    no_replies: 'Ancora nessuna risposta.',
    no_sites_yet: 'Non hai ancora nessun sito.',
    no_new_notifications: 'Non hai nuove notifiche.',
    not_found: 'Spiacente, %{term} non esiste.',
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
