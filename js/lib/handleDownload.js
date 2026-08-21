/* @flow */
'use strict';

import { Alert, Platform, Share, ToastAndroid } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import i18n from 'i18n-js';

export const MAX_BRIDGED_DOWNLOAD_BYTES = 25 * 1024 * 1024;

let downloadSequence = 0;

export function sanitizeFilename(name) {
  if (typeof name !== 'string') {
    return 'download';
  }

  const cleaned = name
    .normalize('NFC')
    .replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu, '')
    .replace(/^\.+/, '')
    .replace(/[. ]+$/, '')
    .replace(/[/\\:]+/g, '_')
    .replace(/_+(\.[^.]*)$/, '$1')
    .trim()
    .slice(0, 180);

  return cleaned || 'download';
}

function base64ByteLength(value) {
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  return Math.floor((value.length * 3) / 4) - padding;
}

export function validateDownloadMessage(message) {
  if (
    !message ||
    typeof message !== 'object' ||
    message.type !== 'download' ||
    message.version !== 1 ||
    message.encoding !== 'base64' ||
    typeof message.filename !== 'string' ||
    typeof message.mimeType !== 'string' ||
    typeof message.data !== 'string' ||
    !Number.isSafeInteger(message.byteLength)
  ) {
    throw new Error('Invalid download request');
  }

  if (
    message.byteLength < 0 ||
    message.byteLength > MAX_BRIDGED_DOWNLOAD_BYTES ||
    message.data.length > Math.ceil((MAX_BRIDGED_DOWNLOAD_BYTES * 4) / 3) + 2
  ) {
    throw new Error('Download is too large');
  }

  if (
    !/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(message.mimeType) ||
    !/^[a-z0-9+/]*={0,2}$/i.test(message.data) ||
    message.data.length % 4 !== 0 ||
    base64ByteLength(message.data) !== message.byteLength
  ) {
    throw new Error('Invalid download data');
  }

  return {
    filename: sanitizeFilename(message.filename),
    mimeType: message.mimeType,
    data: message.data,
  };
}

function temporaryPath(filename) {
  downloadSequence += 1;
  const uniquePart = `${Date.now()}-${downloadSequence}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  return `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${uniquePart}-${filename}`;
}

async function saveAndroidDownload(path, { filename, mimeType }) {
  if (ReactNativeBlobUtil.MediaCollection?.copyToMediaStore) {
    await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
      { name: filename, parentFolder: '', mimeType },
      'Download',
      path,
    );
    ToastAndroid.show(
      i18n.t('download.saved', { filename }),
      ToastAndroid.LONG,
    );
    return;
  }

  throw new Error(i18n.t('download.unsupported'));
}

export default async function handleDownload(message) {
  let path;

  try {
    const download = validateDownloadMessage(message);
    path = temporaryPath(download.filename);
    await ReactNativeBlobUtil.fs.writeFile(path, download.data, 'base64');

    if (Platform.OS === 'ios') {
      await Share.share({
        url: `file://${path}`,
        title: download.filename,
      });
    } else {
      await saveAndroidDownload(path, download);
    }
  } catch (error) {
    Alert.alert(
      i18n.t('download.failed_title'),
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    if (path) {
      await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
    }
  }
}
