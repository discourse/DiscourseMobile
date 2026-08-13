/* @flow */
'use strict';

import { AudioSession } from '@livekit/react-native';
import { Room, RoomEvent } from 'livekit-client';

// Native LiveKit bridge (v1) for LiveKit-based plugins (e.g. resenha).
//
// WKWebView force-mutes getUserMedia microphone capture when the app is
// backgrounded (https://bugs.webkit.org/show_bug.cgi?id=233419), so pages
// running inside the iOS webview can hand their call off to this native
// bridge instead of connecting to LiveKit in-page.
//
// Protocol:
//   page -> app  window.ReactNativeWebView.postMessage(
//                  JSON.stringify({ livekit: { action, ...args } }))
//                actions: probe | connect(url, token, roomName, micEnabled)
//                         | disconnect | setMicrophone(enabled)
//   app -> page  CustomEvent("LiveKitBridgeState", { detail: snapshot() })
//                emitted on every state change and in response to probe.
//
// The page must not join the room in-page while the bridge is connected —
// that would create a duplicate participant.

export const BRIDGE_VERSION = 1;

class LiveKitBridge {
  constructor() {
    this.room = null;
    this.roomName = null;
    this.state = 'disconnected';
    this.lastError = null;
    this.subscribers = new Set();
  }

  // subscribers receive the state snapshot on every change;
  // returns an unsubscribe function
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  snapshot() {
    const remoteParticipants = this.room
      ? Array.from(this.room.remoteParticipants.values()).map(p => ({
          identity: p.identity,
          name: p.name || p.identity,
        }))
      : [];

    return {
      bridgeVersion: BRIDGE_VERSION,
      state: this.state,
      roomName: this.roomName,
      micEnabled: this.room?.localParticipant?.isMicrophoneEnabled ?? false,
      participants: remoteParticipants,
      ...(this.lastError ? { error: this.lastError } : {}),
    };
  }

  async handleMessage(message) {
    switch (message?.action) {
      case 'probe':
        this._emit();
        break;
      case 'connect':
        await this.connect(message);
        break;
      case 'disconnect':
        await this.disconnect();
        break;
      case 'setMicrophone':
        await this.setMicrophone(!!message.enabled);
        break;
      default:
        console.log('LiveKitBridge: unknown action', message?.action);
    }
  }

  async connect({ url, token, roomName, micEnabled = true }) {
    if (!url || !token) {
      this._setState('error', 'connect requires url and token');
      return;
    }

    if (this.room) {
      await this.disconnect();
    }

    this.roomName = roomName || null;
    this.lastError = null;
    this._setState('connecting');

    try {
      await AudioSession.startAudioSession();

      const room = new Room({ adaptiveStream: true });
      this.room = room;

      room
        .on(RoomEvent.Reconnecting, () => this._setState('reconnecting'))
        .on(RoomEvent.Reconnected, () => this._setState('connected'))
        .on(RoomEvent.Disconnected, () => this._teardown())
        .on(RoomEvent.ParticipantConnected, () => this._emit())
        .on(RoomEvent.ParticipantDisconnected, () => this._emit())
        .on(RoomEvent.LocalTrackPublished, () => this._emit())
        .on(RoomEvent.LocalTrackUnpublished, () => this._emit());

      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(micEnabled);

      this._setState('connected');
    } catch (e) {
      console.log('LiveKitBridge: connect failed', e);
      this.lastError = e?.message || 'connect failed';
      await this._teardown('error');
    }
  }

  async disconnect() {
    const room = this.room;
    if (room) {
      // _teardown runs via the Disconnected room event, but call it
      // explicitly too in case the event never fires
      await room.disconnect();
    }
    await this._teardown();
  }

  async setMicrophone(enabled) {
    if (!this.room) {
      return;
    }

    try {
      await this.room.localParticipant.setMicrophoneEnabled(enabled);
    } catch (e) {
      console.log('LiveKitBridge: setMicrophone failed', e);
    }
    this._emit();
  }

  async _teardown(finalState = 'disconnected') {
    if (this.room) {
      this.room.removeAllListeners();
      this.room = null;
    }
    this.roomName = null;

    try {
      await AudioSession.stopAudioSession();
    } catch (e) {
      console.log('LiveKitBridge: stopAudioSession failed', e);
    }

    this._setState(finalState);
  }

  _setState(state, error = null) {
    this.state = state;
    if (error) {
      this.lastError = error;
    }
    this._emit();
  }

  _emit() {
    const detail = this.snapshot();
    this.subscribers.forEach(callback => {
      try {
        callback(detail);
      } catch (e) {
        console.log('LiveKitBridge: subscriber failed', e);
      }
    });
  }
}

// app-wide singleton: the call must survive webview unmounts and
// site/screen switches
export default new LiveKitBridge();
