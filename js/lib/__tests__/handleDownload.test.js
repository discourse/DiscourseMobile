/* @flow */
'use strict';

import { Alert, Platform, Share, ToastAndroid } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import handleDownload, {
  MAX_BRIDGED_DOWNLOAD_BYTES,
  sanitizeFilename,
  validateDownloadMessage,
} from '../handleDownload';

jest.mock('i18n-js', () => ({
  t: (key, params) => (params?.filename ? `${key}:${params.filename}` : key),
}));

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: { CacheDir: '/cache' },
    writeFile: jest.fn(() => Promise.resolve()),
    unlink: jest.fn(() => Promise.resolve()),
  },
  MediaCollection: {
    copyToMediaStore: jest.fn(() => Promise.resolve()),
  },
}));

function message(overrides = {}) {
  return {
    type: 'download',
    version: 1,
    encoding: 'base64',
    filename: 'theme.zip',
    mimeType: 'application/zip',
    byteLength: 1,
    data: 'eA==',
    ...overrides,
  };
}

describe('handleDownload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    Share.share = jest.fn(() => Promise.resolve());
    Alert.alert = jest.fn();
    ToastAndroid.show = jest.fn();
  });

  test('sanitizes filenames used in native paths', () => {
    expect(sanitizeFilename('../../bad\\name:\u0000.zip')).toBe(
      '_.._bad_name.zip',
    );
    expect(sanitizeFilename('...')).toBe('download');
  });

  test('rejects malformed and oversized messages', () => {
    expect(() =>
      validateDownloadMessage(message({ data: 'not base64' })),
    ).toThrow('Invalid download data');
    expect(() =>
      validateDownloadMessage(
        message({ byteLength: MAX_BRIDGED_DOWNLOAD_BYTES + 1 }),
      ),
    ).toThrow('Download is too large');
  });

  test('writes, shares, and removes an iOS temporary file', async () => {
    await handleDownload(message());

    expect(ReactNativeBlobUtil.fs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/^\/cache\/.+-theme\.zip$/),
      'eA==',
      'base64',
    );
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'theme.zip' }),
    );
    expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  test('removes the temporary file and reports native failures', async () => {
    ReactNativeBlobUtil.fs.writeFile.mockRejectedValueOnce(
      new Error('disk full'),
    );

    await handleDownload(message());

    expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'download.failed_title',
      'disk full',
    );
  });
});
