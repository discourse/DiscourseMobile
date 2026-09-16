/* @flow */
'use strict';

import { Alert, Platform, Share } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import i18n from 'i18n-js';

export const MAX_BRIDGED_DOWNLOAD_BYTES = 25 * 1024 * 1024;

const CLEANUP_DELAY = 20_000;

let downloadSequence = 0;

export function sanitizeFilename(name) {
  if (typeof name !== 'string') {
    return 'download';
  }

  const cleaned = name.replace(/[/\\:\0]+/g, '_').trim();
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
    typeof message.filename !== 'string' ||
    typeof message.data !== 'string'
  ) {
    throw new Error('Invalid download request');
  }

  if (
    !/^[a-z0-9+/]*={0,2}$/i.test(message.data) ||
    message.data.length % 4 !== 0
  ) {
    throw new Error('Invalid download data');
  }
  if (base64ByteLength(message.data) > MAX_BRIDGED_DOWNLOAD_BYTES) {
    throw new Error('Download is too large');
  }

  return {
    filename: sanitizeFilename(message.filename),
    mimeType:
      typeof message.mimeType === 'string'
        ? message.mimeType
        : 'application/octet-stream',
    data: message.data,
  };
}

function temporaryDirectory() {
  downloadSequence += 1;
  const unique = `${Date.now()}-${downloadSequence}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  return `${ReactNativeBlobUtil.fs.dirs.CacheDir}/download-${unique}`;
}

function scheduleCleanup(dir) {
  setTimeout(() => {
    ReactNativeBlobUtil.fs.unlink(dir).catch(() => {});
  }, CLEANUP_DELAY);
}

// The web side only selects the "bridge" download strategy on iOS (see
// discourse/discourse's attachmentDownloadStrategy). Android's WebView has
// handled downloads via the system DownloadManager since react-native-webview
// 2.15, so it should never send us a `type: "download"` message — this guard
// is defense-in-depth in case a stale web build or app version mismatch
// still fires one.
export default async function handleDownload(message) {
  if (Platform.OS !== 'ios') {
    console.warn(
      'handleDownload: ignoring download message on non-iOS platform',
    );
    return;
  }

  let dir;

  try {
    const download = validateDownloadMessage(message);
    dir = temporaryDirectory();
    await ReactNativeBlobUtil.fs.mkdir(dir);
    const path = `${dir}/${download.filename}`;
    await ReactNativeBlobUtil.fs.writeFile(path, download.data, 'base64');

    await Share.share({
      url: `file://${path}`,
      title: download.filename,
    });
  } catch (error) {
    console.warn('handleDownload failed', error);
    Alert.alert(
      i18n.t('download.failed_title'),
      i18n.t('download.failed_message'),
    );
  } finally {
    if (dir) {
      scheduleCleanup(dir);
    }
  }
}
