/* @flow */
'use strict';

import { Alert, Platform, Share } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import handleDownload, {
  MAX_BRIDGED_DOWNLOAD_BYTES,
  sanitizeFilename,
  validateDownloadMessage,
} from '../handleDownload';

jest.mock('i18n-js', () => ({
  t: key => key,
}));

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: { CacheDir: '/cache' },
    mkdir: jest.fn(() => Promise.resolve()),
    writeFile: jest.fn(() => Promise.resolve()),
    unlink: jest.fn(() => Promise.resolve()),
  },
}));

function message(overrides = {}) {
  return {
    type: 'download',
    filename: 'theme.zip',
    mimeType: 'application/zip',
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
  });

  test('strips path separators from filenames', () => {
    expect(sanitizeFilename('../bad/name:file.zip')).toBe(
      '.._bad_name_file.zip',
    );
    expect(sanitizeFilename('')).toBe('download');
    expect(sanitizeFilename(null)).toBe('download');
  });

  test('rejects messages missing required fields', () => {
    expect(() => validateDownloadMessage(null)).toThrow(
      'Invalid download request',
    );
    expect(() => validateDownloadMessage(message({ type: 'other' }))).toThrow();
    expect(() => validateDownloadMessage(message({ filename: 123 }))).toThrow();
  });

  test('rejects non-base64 payloads', () => {
    expect(() =>
      validateDownloadMessage(message({ data: 'not base64!' })),
    ).toThrow('Invalid download data');
    expect(() => validateDownloadMessage(message({ data: 'abc' }))).toThrow(
      'Invalid download data',
    );
  });

  test('rejects payloads over the receiver-side size cap', () => {
    const overCap = 'A'.repeat(
      Math.ceil(((MAX_BRIDGED_DOWNLOAD_BYTES + 4) * 4) / 3 / 4) * 4,
    );
    expect(() => validateDownloadMessage(message({ data: overCap }))).toThrow(
      'Download is too large',
    );
  });

  test('writes to a unique directory so the shared filename is preserved', async () => {
    await handleDownload(message());

    expect(ReactNativeBlobUtil.fs.mkdir).toHaveBeenCalledWith(
      expect.stringMatching(/^\/cache\/download-/),
    );
    expect(ReactNativeBlobUtil.fs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/^\/cache\/download-.+\/theme\.zip$/),
      'eA==',
      'base64',
    );
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringMatching(
          /^file:\/\/\/cache\/download-.+\/theme\.zip$/,
        ),
      }),
    );
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  test('unlinks the temp directory after the cleanup delay', async () => {
    jest.useFakeTimers();
    try {
      await handleDownload(message());

      expect(ReactNativeBlobUtil.fs.unlink).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/^\/cache\/download-/),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  test('alerts a generic failure when the write fails', async () => {
    ReactNativeBlobUtil.fs.writeFile.mockRejectedValueOnce(
      new Error('disk full'),
    );

    await handleDownload(message());

    expect(Alert.alert).toHaveBeenCalledWith(
      'download.failed_title',
      'download.failed_message',
    );
  });

  test('ignores messages on non-iOS platforms', async () => {
    Platform.OS = 'android';

    await handleDownload(message());

    expect(ReactNativeBlobUtil.fs.mkdir).not.toHaveBeenCalled();
    expect(ReactNativeBlobUtil.fs.writeFile).not.toHaveBeenCalled();
    expect(Share.share).not.toHaveBeenCalled();
  });
});
