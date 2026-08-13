# resenha × Discourse Hub — native LiveKit bridge, plugin-side implementation plan

> **Context for the implementer — read this first**
>
> This document is the plugin-side half of a two-sided feature. The Discourse Hub (mobile app) half is already built. Written 2026-08-13 by Claude pairing with Gabriel Grubba on the Hub side.
>
> - **Hub config groundwork (merged path):** https://github.com/discourse/DiscourseMobile/pull/297 — background audio mode, webview media permissions/autoplay. Its PR description documents the platform behavior matrix.
> - **Hub native bridge (the counterpart of this plan):** branch [`livekit-native-bridge`](https://github.com/discourse/DiscourseMobile/tree/livekit-native-bridge) — the app-side protocol implementation lives in [`js/livekit/bridge.js`](https://github.com/discourse/DiscourseMobile/blob/livekit-native-bridge/js/livekit/bridge.js) (read it; it is short and is the source of truth for app behavior), UI in `js/livekit/CallBar.js`, page wiring in `js/screens/WebViewScreenComponents/WebViewComponent.js`.
> - **Why this exists:** WKWebView force-mutes `getUserMedia` microphone capture when the app is backgrounded ([WebKit bug 233419](https://bugs.webkit.org/show_bug.cgi?id=233419), unfixed as of iOS 18.3). So resenha-in-a-page works on desktop and on Android Hub (which opens sites in real Chrome via Custom Tabs), but an iOS Hub user in an in-page call goes silent whenever they background the app. The fix: when running inside iOS Hub, the page hands the LiveKit server URL + a room JWT to the app, which joins the room **natively** via `@livekit/react-native` — native mic capture keeps working in the background, and the call survives page navigation and even the webview being dismissed.
> - **Deliberate v1 decisions (don't redesign these here):** audio rooms use the bridge; video rooms stay in-page (iOS suspends camera capture for every backgrounded app anyway — even Discord pauses your camera). Screen share can never be *initiated* from any mobile browser (`getDisplayMedia` is unavailable on iOS Safari/WKWebView and Chrome for Android) — hide the button on mobile; *viewing* shares is unaffected. The protocol below is fixed and already implemented app-side; `setCamera` / `startScreenShare` are reserved for bridge v2 (native ReplayKit screen share, CallKit).
> - **The one invariant that must never break:** while the bridge is connected, the page must NOT also join the LiveKit room in-page — that creates a duplicate participant.

---

## Scope and architecture summary

Two connection modes for a resenha room on the client:

- **In-page mode (existing, unchanged default):** the browser page connects to LiveKit via `livekit-client`. Used everywhere today, and remains the path for: desktop, Android (Chrome Custom Tabs — no bridge exists there), iOS Safari, and **video-enabled rooms on iOS Hub** (v1 decision).
- **Native bridge mode (new):** when the page runs inside the iOS Discourse Hub webview and the Hub answers the bridge probe, the page hands `{ url, token }` to the app via `postMessage`; the app joins the LiveKit room natively (`@livekit/react-native`), so mic capture survives backgrounding. The page **never** creates an in-page LiveKit connection in this mode (it would appear as a duplicate participant). Room UI is driven by (a) `LiveKitBridgeState` events from the app and (b) resenha's existing server-side presence (LiveKit webhooks → MessageBus).

Mode selection matrix (v1):

| Environment | Audio room | Video room |
|---|---|---|
| iOS Hub, bridge probe ACKed, setting on | **Native bridge** | In-page + one-time background-mic notice |
| iOS Hub, probe timed out (old Hub) or setting off | In-page + notice | In-page + notice |
| Android (Chrome Custom Tabs), mobile Safari | In-page | In-page |
| Desktop | In-page | In-page |

Screen-share **initiation** is hidden wherever `navigator.mediaDevices.getDisplayMedia` is unavailable (all iOS browsers/webviews, Chrome for Android). **Viewing** remote screen shares is unchanged everywhere; in bridge mode there is no in-page connection at all, so remote video/screen tracks are not rendered — audio rooms only, by definition.

Everything below assumes standard Discourse plugin layout (`plugin.rb`, `config/settings.yml`, `assets/javascripts/discourse/{services,initializers,components}`, `spec/system`). Spots marked **ADAPT** must be mapped to resenha's actual file/identifier names by the implementer.

## Bridge protocol v1 reference (fixed contract — implement exactly, do not redesign)

Page → App, always wrapped as `window.ReactNativeWebView.postMessage(JSON.stringify({ livekit: <message> }))`:

- `{ action: "probe" }` — request a state event (feature detection).
- `{ action: "connect", url, token, roomName, micEnabled }` — `url` = LiveKit server wss URL, `token` = freshly-minted room-scoped JWT (same kind the web client uses), `roomName` = display name, `micEnabled` = initial mic state. If a native call is already active, the app disconnects it first.
- `{ action: "disconnect" }`
- `{ action: "setMicrophone", enabled: <bool> }`
- Reserved for v2, do **not** send: `setCamera`, `startScreenShare`.

App → Page: `window.dispatchEvent(new CustomEvent("LiveKitBridgeState", { detail }))`:

```
{
  bridgeVersion: 1,
  state: "disconnected" | "connecting" | "connected" | "reconnecting" | "error",
  roomName: string | null,
  micEnabled: bool,
  participants: [{ identity, name }],
  error?: string            // only when state === "error"
}
```

Feature detection: send `probe`, wait up to ~500 ms for **any** `LiveKitBridgeState` event with `bridgeVersion >= 1`. No event → old Hub (it silently ignores unknown postMessage keys) → fall back to in-page. State events are also emitted spontaneously on every native state change, including immediately after page navigations within the same webview — the listener must be installed for the whole page lifetime, not just during the probe.

Useful core helpers (verified against current discourse/discourse):

- `postRNWebviewMessage(prop, value)` from `discourse/lib/utilities` — does exactly `window.ReactNativeWebView.postMessage(JSON.stringify({ [prop]: value }))`, so `postRNWebviewMessage("livekit", { action: "probe" })` produces the required wire format.
- `capabilities` service (`discourse/services/capabilities`) — `isAppWebview` is `window.ReactNativeWebView !== undefined`.
- UA check: the Hub appends `DiscourseHub` (on large iPads `DiscourseHub <deviceId>`) via `applicationNameForUserAgent`, so use `navigator.userAgent.includes("DiscourseHub")`, never an equality/suffix match.

## Implementation steps

### 1. Site setting and locale strings

- Add to `config/settings.yml` under the plugin's category:
  ```yaml
  resenha_native_bridge_enabled:
    default: false
    client: true
  ```
  `client: true` is required so the Ember side can read it. **ADAPT:** match the existing settings category/naming prefix in resenha's `settings.yml`.
- Add `site_settings.resenha_native_bridge_enabled` description to `config/locales/server.en.yml`, and client strings (used in later steps) to `config/locales/client.en.yml` under the plugin's `js.` namespace: bridge error toast, retry button, "Connected via app" indicator label, in-call banner text, background-mic notice text, e.g. `js.resenha.native_bridge.{error,retry,connected_via_app,in_call_banner,background_mic_notice}`.
- **Done when:** setting appears in admin, defaults off, and is visible in `siteSettings` on the client.

### 2. Bridge service: `assets/javascripts/discourse/services/livekit-native-bridge.js` (new file)

An Ember service owning all bridge I/O. Nothing else in the plugin should touch `window.ReactNativeWebView` or the `LiveKitBridgeState` event directly.

Sketch (adjust imports to resenha's lint config):

```js
import { tracked } from "@glimmer/tracking";
import Service, { service } from "@ember/service";
import { postRNWebviewMessage } from "discourse/lib/utilities";

const PROBE_TIMEOUT_MS = 500;

export default class LiveKitNativeBridge extends Service {
  @service capabilities;
  @service siteSettings;

  @tracked bridgeState = null;        // last LiveKitBridgeState detail, or null
  @tracked available = null;          // null = unknown, true/false after detect()

  #detectPromise = null;
  #resolveDetect = null;
  #listener = null;

  get preconditionsMet() {
    return (
      this.siteSettings.resenha_native_bridge_enabled &&
      this.capabilities.isAppWebview &&
      navigator.userAgent.includes("DiscourseHub")
    );
  }

  get isNativeBridgeAvailable() {
    return this.available === true;
  }

  init() {
    super.init(...arguments);
    if (this.preconditionsMet) {
      this.#listener = (e) => this.#onStateEvent(e.detail);
      window.addEventListener("LiveKitBridgeState", this.#listener);
    }
  }

  willDestroy() {
    if (this.#listener) {
      window.removeEventListener("LiveKitBridgeState", this.#listener);
    }
    super.willDestroy(...arguments);
  }

  detect() {
    if (!this.preconditionsMet) {
      this.available = false;
      return Promise.resolve(false);
    }
    this.#detectPromise ??= new Promise((resolve) => {
      if (this.bridgeState?.bridgeVersion >= 1) {
        this.available = true;
        return resolve(true);   // a spontaneous event already arrived
      }
      const timer = setTimeout(() => {
        this.available = this.bridgeState?.bridgeVersion >= 1;
        resolve(this.available);
      }, PROBE_TIMEOUT_MS);
      this.#resolveDetect = (ok) => { clearTimeout(timer); this.available = ok; resolve(ok); };
      postRNWebviewMessage("livekit", { action: "probe" });
    });
    return this.#detectPromise;
  }

  connect({ url, token, roomName, micEnabled }) {
    postRNWebviewMessage("livekit", { action: "connect", url, token, roomName, micEnabled });
  }
  disconnect() { postRNWebviewMessage("livekit", { action: "disconnect" }); }
  setMicrophone(enabled) { postRNWebviewMessage("livekit", { action: "setMicrophone", enabled }); }

  #onStateEvent(detail) {
    if (!detail || detail.bridgeVersion == null) return;
    this.bridgeState = detail;
    this.#resolveDetect?.(detail.bridgeVersion >= 1);
    this.#resolveDetect = null;
  }
}
```

Also expose convenience getters used by the UI: `state` (`this.bridgeState?.state ?? "disconnected"`), `micEnabled`, `participants`, `roomName`, `isConnected`, `isConnecting` (covers `connecting` + `reconnecting`).

- **Done when:** unit tests (step 11) pass for: probe → fake ACK → `available === true`; probe with no responder → `false` after ~500 ms; a spontaneous state event received *before* `detect()` resolves detection immediately; every event updates `bridgeState`.

### 3. Eager instantiation + probe on page load: `assets/javascripts/discourse/initializers/resenha-native-bridge.js` (new file)

Ember services are lazy; the listener and probe must run on every full page load so the page reconciles with a native call that survived navigation (see step 9).

```js
import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "resenha-native-bridge",
  initialize(container) {
    withPluginApi((api) => {
      const bridge = container.lookup("service:livekit-native-bridge");
      if (bridge.preconditionsMet) {
        bridge.detect(); // fire-and-forget; caches result
      }
    });
  },
};
```

**ADAPT:** if resenha already has an initializer that boots its call service, fold this into it; keep the guard so non-Hub browsers pay zero cost. Also gate on `api.getCurrentUser()` if resenha rooms are login-only.

- **Done when:** loading any page inside iOS Hub (new build) results in one probe postMessage and a cached `available === true`; desktop/Android never post.

### 4. Join-flow branching

**ADAPT (main integration point):** locate where resenha currently (a) fetches the join token from its token endpoint (something like `ajax("/resenha/rooms/${id}/token")`) and (b) calls `new Room()` / `room.connect(url, token)` from `livekit-client`. This most likely lives in a central call service (e.g. `assets/javascripts/discourse/services/resenha.js` or `.../resenha-call.js`) or in the room component's join action.

Insert branching *after* token fetch is factored out and *before* any in-page `Room` object is created:

```js
async joinRoom(room) {
  const useBridge =
    !room.videoEnabled &&                       // ADAPT: resenha's audio-vs-video flag
    (await this.livekitNativeBridge.detect());

  const { url, token } = await this.mintToken(room);  // ALWAYS fresh, immediately before connect

  if (useBridge) {
    this.connectionMode = "native";
    this.livekitNativeBridge.connect({
      url,
      token,
      roomName: room.title,                     // ADAPT: display name field
      micEnabled: this.defaultMicEnabled,       // ADAPT: honor resenha's join-muted default
    });
    return; // NO in-page Room is created — critical, prevents duplicate participant
  }

  this.connectionMode = "in-page";
  // ... existing in-page path unchanged ...
}
```

Requirements:

- Track `connectionMode` (`"in-page" | "native" | null`) as `@tracked` state on the call service; every downstream consumer branches on it.
- The token endpoint must return (or be extended to return) both the LiveKit server URL and the JWT. If resenha currently hardcodes/settings-reads the URL client-side, reuse that for `url`. **ADAPT.**
- Audit every code path that assumes a local `Room`/local tracks exist (device pickers, output-device selection, local audio level meters, `room.localParticipant` reads) and guard them with `connectionMode === "in-page"`.
- Rooms that can toggle video on mid-call: v1 decision is that mode is chosen at join time from the room's configuration; if a room is video-capable at all, it takes the in-page path. **ADAPT/confirm** with the room model (open question 1).

- **Done when:** joining an audio room in iOS Hub produces exactly one native participant (verify in LiveKit server dashboard: one participant identity, none from the web page), and joining a video room still uses the in-page path.

### 5. Reflect native state in the room UI

In bridge mode the app is the single source of truth. Listen via the service's tracked `bridgeState` (autotracking — no manual event wiring in components).

State mapping for the room UI (**ADAPT** to resenha's actual join/leave/mute components):

| `bridgeState.state` | UI |
|---|---|
| `connecting` | joining spinner on the join button, controls disabled |
| `connected` | in-call UI: leave button, mute toggle enabled, "Connected via app" indicator (small label/icon so testers can tell the modes apart) |
| `reconnecting` | in-call UI with a "reconnecting" indicator; mute toggle stays visible |
| `disconnected` | idle/joinable UI; clear any local "joined" flag |
| `error` | error UI (step 8) |

Mute button in bridge mode: on click, call `bridge.setMicrophone(!bridge.micEnabled)`. Render the button state from `bridge.micEnabled` (the value echoed back by the app), not from a local flag — optimistic flip is acceptable but must reconcile on the next state event. Never touch `localParticipant.setMicrophoneEnabled` in this mode.

- **Done when:** toggling mute in the page toggles the native mic (audible to another participant) and the button reflects the app-reported value; killing/reopening the connection from the native side updates the page UI without a reload.

### 6. Roster and speaking indicators in bridge mode

The page has no LiveKit connection, so `RoomEvent.ParticipantConnected` etc. are unavailable. Sources, in priority order:

1. **Server-side presence (primary).** resenha almost certainly already renders room occupancy to non-joined users via LiveKit webhooks (`participant_joined` / `participant_left`) republished on a MessageBus channel (something like `/resenha/rooms/:id`). **ADAPT:** find that channel/subscription and reuse the exact same roster rendering for the joined-via-bridge state. If the current code switches to LiveKit-driven roster once joined, add a `connectionMode === "native"` branch that keeps the MessageBus roster instead.
2. **Bridge `participants` (secondary/cross-check).** Each state event carries `[{ identity, name }]`. Use it to (a) confirm the local user's join succeeded (own identity appears) and (b) paper over webhook latency if the server roster lags. Note `identity` is whatever resenha encodes in the JWT (likely user id or username) — map it the same way the server roster does. **ADAPT.**

Speaking indicators: **not available in bridge v1** — no in-page connection, no `ActiveSpeakersChanged`, and LiveKit webhooks don't carry speaking events. Do not fake it. Degrade gracefully:

- When `connectionMode === "native"`, suppress speaking rings/waveform animations entirely (static avatars) rather than showing permanently-idle indicators, and make sure their absence causes no layout shift.
- Structure the roster component so a future `speakingIdentities` input can light indicators back up when bridge v2 adds it — i.e., indicators keyed off a nullable data source, not off connection mode checks scattered in templates.

- **Done when:** a bridge-mode user sees other participants join/leave within webhook latency (~1–2 s), sees themselves in the roster after connect, and no speaking UI renders in bridge mode.

### 7. Token freshness and reconnects

- Mint the token in `joinRoom` immediately before `bridge.connect(...)` — never reuse a token cached from page load or a previous attempt. Every retry (step 8) re-mints.
- The native side handles transport reconnects internally (surfacing `reconnecting` states); the page does nothing except render them. There is no page-side token-refresh loop: LiveKit only needs the JWT at connect time.
- Server side: confirm the token TTL comfortably covers the connect handshake (a few minutes is plenty; do not shorten below ~1 minute). **ADAPT:** check the TTL in resenha's token controller/service (wherever `LiveKit::AccessToken` or equivalent is built) — no change expected, just verification.

- **Done when:** retry after a failed connect visibly hits the token endpoint again (network tab), and a network blip on device recovers through `reconnecting → connected` with no page action.

### 8. Error handling

- `state: "error"` from the bridge → show the error to the user (Discourse toast/dialog service, **ADAPT** to whatever resenha uses for call errors) with the `error` string and a **Retry** action. Retry = re-run the full join flow (fresh token → `connect`).
- Watchdog: after sending `connect`, if no state event advances past `disconnected` within ~10 s, treat as an error (same UI). Implement in the call service, cleared on any `connecting/connected` event.
- Fallback to in-page: recommended v1 behavior — if the bridge connect **never reached `connected`** (error or watchdog during initial connect), offer a second action "Join in browser instead" that runs the in-page path, and set a session flag (plain module state is fine) so subsequent joins this page-session skip the bridge. Do not auto-fall-back silently on errors *after* a successful `connected` (that would create a duplicate-participant risk if native teardown is slow); on post-connect errors, Retry only. Send a defensive `disconnect()` before any in-page fallback join.

- **Done when:** forcing a failure (bad LiveKit URL via test setting, or airplane-moded device) produces the error UI; Retry works; fallback join produces a working in-page call with no duplicate participant.

### 9. Leaving, switching rooms, logout, and call-survives-navigation reconciliation

- **Leave button** (bridge mode): call `bridge.disconnect()`; UI returns to idle when the `disconnected` event arrives (do not optimistically assume — the event arrives fast). Also allow leave while `connecting`.
- **Switching rooms:** the protocol guarantees the app disconnects an active call before honoring a new `connect`, so native→native switching is just `joinRoom(newRoom)`. The one dangerous transition is **native audio call → in-page video room**: explicitly `bridge.disconnect()` before starting the in-page connection, otherwise the user is in two rooms at once. Put this guard at the top of the in-page join path: `if (bridge.isConnected) bridge.disconnect();`.
- **Logout:** send `disconnect()` wherever resenha currently tears down an in-page call on logout (**ADAPT**; if resenha has no logout teardown today, add the bridge disconnect to the plugin's logout handling — a native call continuing after logout is a privacy problem, unlike navigation).
- **Navigation/webview dismissal is a feature, not a leak:** the native call intentionally survives the page closing. Reconciliation on return:
  - The step-3 initializer probes on every full page load; if the resulting state event says `connected`, the page knows a native call is live before any route renders.
  - Add a small global **in-call banner** component (new file, e.g. `assets/javascripts/discourse/components/resenha-native-call-banner.gjs`) rendered via a plugin outlet visible on all pages (`above-site-header` or resenha's existing global-call-UI outlet if it has one — **ADAPT**): shows `bridgeState.roomName`, a "Return to room" link, and a Leave button (`disconnect()`). Guard rendering with `connectionMode/bridge.isConnected`.
  - On the room page itself, decide "am I in *this* room natively?" using **server presence as the authority** (current user's identity in the room's participant list), because the bridge only reports a display name, which is not a reliable key. If server presence says yes and `bridge.state === "connected"`, render the joined UI with `connectionMode = "native"` (restoring step 5 behavior). If bridge says connected but presence puts the user in a *different* room, the banner's "Return to room" should link there (**ADAPT:** presence lookup for "which room contains current user" — resenha likely has this for its rooms index).

- **Done when:** join audio room in Hub → navigate away → dismiss webview → audio keeps flowing (native) → reopen site in Hub → banner shows within a second of page load → visiting the room shows joined state → Leave works from both banner and room UI.

### 10. Mobile-web UX polish (independent of the bridge, ships regardless of the setting)

1. **Hide screen-share initiation** wherever it renders (**ADAPT:** the room controls component). Condition:
   ```js
   const canInitiateScreenShare = typeof navigator.mediaDevices?.getDisplayMedia === "function";
   ```
   Note the optional chain: `navigator.mediaDevices` itself is undefined in insecure contexts. Feature-detect — do not UA-sniff. Rendering *remote* screen-share tracks stays untouched.
2. **One-time background-mic notice** for in-page rooms inside iOS Hub (applies to video rooms always, and to audio rooms when the bridge is unavailable/disabled). Condition: `capabilities.isAppWebview && navigator.userAgent.includes("DiscourseHub") && connectionMode === "in-page"`. Show a dismissible inline notice/toast on join: *"Heads up: while this app is in the background, your microphone is paused and others can't hear you."* Persist dismissal with `KeyValueStore` from `discourse/lib/key-value-store` (context prefix e.g. `discourse_resenha_`, key `background-mic-notice-dismissed`) so it shows once per device.

- **Done when:** share button absent on iOS Safari/Hub and Android Chrome, present on desktop; notice shows exactly once per device on the first qualifying join.

### 11. Tests

**QUnit (plugin `test/javascripts/` or `assets/javascripts/discourse/tests/` — ADAPT to resenha's existing test layout):** this is where the bridge logic is actually testable, via a fake bridge installed in `beforeEach`:

```js
window.ReactNativeWebView = {
  postMessage(json) {
    const { livekit } = JSON.parse(json);
    sentMessages.push(livekit);
    // fake app: respond to probe/connect/etc. by dispatching LiveKitBridgeState
  },
};
```

Cover: detection ACK / timeout / spontaneous-event-before-probe; exact wire shapes of `connect`/`disconnect`/`setMicrophone`; join-flow branching (audio+bridge → native, video → in-page, bridge unavailable → in-page); watchdog error; mute button driven by echoed `micEnabled`; banner renders when a fake `connected` event arrives on load; screen-share button hidden when `getDisplayMedia` is deleted from a stubbed `mediaDevices`; notice one-time behavior with `KeyValueStore`.

**System specs (`spec/system/*_spec.rb`):** honest assessment — the bridge fake must exist *before* the initializer runs at page load, so plain `page.execute_script` after `visit` is too late. If resenha's system-spec harness can inject an init script (Selenium CDP `Page.addScriptToEvaluateOnNewDocument`, or a test-only theme/plugin snippet), add one happy-path spec: fake bridge + Hub UA → join audio room → assert no in-page LiveKit connection is created (e.g. a test hook/window flag set by the in-page path) and the "Connected via app" indicator renders. If injection is impractical, keep bridge coverage in QUnit and use system specs for what they're good at here: token endpoint behavior (fresh token per request, permissions), MessageBus roster updates rendering for a non-joined viewer, and the settings gate (bridge code inert when `resenha_native_bridge_enabled` is false).

**Manual device matrix (required before enabling anywhere real):**

| # | Environment | Scenario | Expected |
|---|---|---|---|
| 1 | iOS Hub (bridge build), setting ON | Join audio room | Native connect; one participant in LiveKit dashboard; "via app" indicator |
| 2 | 〃 | Background the app mid-call, speak | Remote party still hears you (the whole point) |
| 3 | 〃 | Mute/unmute from page, incl. while backgrounded→resumed | Native mic follows; button reflects app state |
| 4 | 〃 | Navigate away, dismiss webview, reopen site | Call uninterrupted; banner appears; room shows joined |
| 5 | 〃 | Leave from banner and from room UI | Native call ends; roster updates for others |
| 6 | 〃 | Switch audio room → audio room; audio room → video room | No double-join; native call ends before in-page video join |
| 7 | 〃 | Airplane mode 10 s mid-call | `reconnecting` shown, then recovers or errors with Retry |
| 8 | iOS Hub (bridge build) | Join **video** room | In-page path; one-time background-mic notice; no share button |
| 9 | iOS Hub (**old App Store build**), setting ON | Join audio room | Probe times out ≤ ~500 ms; silent in-page fallback + notice |
| 10 | iOS Hub, setting OFF | Join audio room | In-page; zero bridge postMessages |
| 11 | iPad (large, device-id UA suffix) | Join audio room | UA substring detection still matches; native connect |
| 12 | Android Chrome Custom Tab | Audio + video rooms | Unchanged behavior; no share button; background audio/mic still work |
| 13 | Desktop Chrome/Firefox/Safari | Audio + video rooms | Unchanged; share button present (Chrome/Edge) |
| 14 | iOS Hub | Log out during native call | Call disconnects |

### 12. Rollout

1. Land the plugin changes with `resenha_native_bridge_enabled: false` — everything ships dark; steps 10.1/10.2 ship live immediately (not gated).
2. Enable the setting on an internal/staging site; test with a TestFlight Hub build from the `livekit-native-bridge` branch against the matrix above.
3. Enable per-site for early adopters. It is safe to enable before the Hub release reaches all users: old Hub versions fail the probe and silently fall back to in-page (matrix row 9 verifies this).
4. Consider defaulting the setting on only after the corresponding Hub version has been in the App Store for a release cycle.

## Acceptance criteria

- Backgrounded iOS Hub user in an audio room remains audible to other participants (matrix row 2).
- Bridge mode never creates a duplicate LiveKit participant, including retry, fallback, and room-switch paths.
- Native call survives page navigation and webview dismissal; page reconciles state within ~1 s of any subsequent page load via the probe.
- Probe timeout falls back to in-page within ~500 ms with no user-visible error on old Hub builds.
- With the setting off, byte-for-byte-equivalent behavior to today (no probes, no listeners doing work).
- Screen-share initiation hidden on all mobile browsers/webviews; viewing shares unaffected.
- Speaking indicators simply absent (not broken/frozen) in bridge mode; roster stays live via MessageBus presence.

## Open questions for the resenha team

1. How is audio-vs-video modeled on a room (per-room flag? can video be enabled mid-call?), and what should happen to a native-bridge participant if their room turns video on mid-call — stay as audio-only (recommended v1) or be prompted to rejoin in-page?
2. Does the existing token endpoint return the LiveKit server URL alongside the JWT, or is the URL a client-visible site setting? (The `connect` payload needs both.)
3. What exactly do the LiveKit webhooks publish over MessageBus today — full participant list or deltas, and keyed by which identity (user id? username?)? Is "which room is user X currently in" already queryable client-side?
4. Where (if anywhere) does resenha tear down an active call on logout today? Confirm the requirement that a native call must not survive logout.
5. What is the join-muted default (join with mic live or muted?) so `micEnabled` in the `connect` payload matches web behavior?
6. Is there an existing global "you're in a call" UI/outlet to reuse for the survives-navigation banner, or should the new plugin-outlet banner from step 9 be the pattern?
7. Product call on step 8's fallback: after a *failed initial* native connect, is an explicit "Join in browser instead" button acceptable, or is silent auto-fallback preferred?
8. What value should `roomName` carry (raw room title? localized/decorated?) given the app displays it in native UI?
9. Current behavior when the same user joins the same room from two devices/connections — does the server or LiveKit config already prevent it, and does that interact with a lingering native session?

## Critical files for implementation

(Paths are the expected locations in the resenha repo; the first two are new files, the rest are the likely existing files to ADAPT.)

- `assets/javascripts/discourse/services/livekit-native-bridge.js` (new — bridge detection + I/O service, step 2)
- `assets/javascripts/discourse/initializers/resenha-native-bridge.js` (new — eager probe on page load, step 3)
- `assets/javascripts/discourse/services/resenha.js` (or whichever service/component owns token fetch + `room.connect` — join-flow branching, steps 4–9; locate via `grep -r "livekit-client" assets/`)
- `config/settings.yml` (site setting gate, step 1)
- `assets/javascripts/discourse/components/` — the room controls/roster component(s) rendering join/mute/share buttons and speaking indicators (steps 5, 6, 10; locate via `grep -r "getDisplayMedia\|setScreenShareEnabled" assets/`)
