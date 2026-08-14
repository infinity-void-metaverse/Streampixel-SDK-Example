# Streampixel SDK Example (v2 — `@streampixel/core`)

A complete reference integration of the **Streampixel Web SDK v2** in React.
Everything a customer integration needs is demonstrated here: authentication
(public, password, SSO), the typed state machine driving a branded loading
screen, queueing, live stats, quality switching, AFK handling, on-screen
keyboard, voice/text chat, shared (SFU) viewing, and developer tooling.

The SDK is **headless** — every pixel of UI in this app (loading screen,
password gate, chat panel, controls…) is example code in
[src/components/App.js](src/components/App.js) that you own. Copy it, restyle
it, or replace it entirely; the SDK only provides events and methods.

---

## Quick start

```bash
npm install
npm start
# open http://localhost:3000/<projectId>      (or /?appId=<projectId>)
```

`<projectId>` is your project id from the Streampixel dashboard.

### URL parameters

| Param | Meaning |
|---|---|
| `?platform=staging` | Target the staging control plane (default is **production**) |
| `?shared=host` | Shared (SFU) viewing — host role: owns the session and input |
| `?shared=viewer&hostStreamerId=<id>` | Watch a host's session (watch-only, enforced server-side) |
| `?streamerId=<id>` | Pin a specific streamer (session affinity) |

---

## The packages

| Package | What it is | Used here |
|---|---|---|
| `@streampixel/core` | Headless engine: auth/tickets, signalling, WebRTC, resilience, telemetry, typed events | ✅ everywhere |
| `@streampixel/core/voice` | Voice/text/video chat (LiveKit) — separate entry so it never lands in bundles that skip chat | ✅ chat panel |
| `@streampixel/ui` | Drop-in overlays (`mountUI(stream, {container})`) for integrations that don't want custom UI | ❌ this app IS the custom-UI path |

This repo consumes the SDK from a **vendored tarball**
(`vendor/streampixel-core-*.tgz`) so a fresh clone builds before the packages
hit npm. Developing both side by side: edit SDK source in
`../SDK-GENERATOR/packages/core`, then

```bash
cd ../SDK-GENERATOR/packages/core && npm run build && npm pack --pack-destination /tmp \
  && cp /tmp/streampixel-core-*.tgz ../../../Streampixel-SDK-Example/vendor/ \
  && cd ../../../Streampixel-SDK-Example && npm install ./vendor/streampixel-core-*.tgz
```

Once v2 publishes to npm, replace the `file:` dep with a version range.

---

## The integration, piece by piece

### 1. Create a session

```js
import { StreamPixel, AuthError } from '@streampixel/core';

const stream = await StreamPixel.create({
  appId,                          // project id
  container: videoRef.current,    // where the <video> mounts
  auth,                           // see below — omit for public projects
  shared,                         // SFU role, or omit for private 1:1
  advanced: { platformHost, telemetryHost, streamerId },
  // Everything else defaults to your dashboard config:
  // codec: { primary: 'AV1', fallback: 'H264' },
  // resolution: { start: '1080p (1920x1080)', mode: 'dynamic' },
  // input: { mouse, keyboard, touch, hover, gamepad, xr },
  // media: { mic, camera },  afk: { timeoutSec },  telemetry: 'standard',
});
```

One call resolves access, mints the session ticket server-side, and starts
connecting. **No API keys ever reach the browser** — the short-lived ticket is
the only client credential.

### 2. Authentication — `AuthError.kind` tells the UI what to show

```js
try { stream = await StreamPixel.create({...}) }
catch (err) {
  if (err instanceof AuthError) switch (err.kind) {
    case 'password-required':   // show the password form
    case 'password-wrong':      // wrong password — show it again with an error
    case 'sso-required':        // manual-redirect mode: navigate to err.ssoStartUrl
    case 'project-offline':     // owner turned the stream off / no build published
    case 'project-not-found':   // bad link
  }
}
// password retry:
StreamPixel.create({ appId, auth: { mode: 'password', password } });
```

SSO projects with `auth: {mode:'auto'}` (the default) redirect to the IdP
automatically and resume with the single-use grant when the viewer returns —
this app needs zero SSO code.

### 3. The state machine drives the loading screen

```js
stream.on('state', (s) => { /* s.kind: resolving → queued → starting →
                               connecting → streaming / stalled → recovering /
                               reconnecting / ended */ });
stream.on('queue', ({ position }) => …);   // live queue position
stream.on('ended', ({ code, reason, endKind }) => …);
// endKind: 'user' | 'afk' | 'server' | 'error' | 'network-blocked'
```

Resilience is built into the SDK — you only *render* these states:
- network drop → automatic reconnect with backoff for up to **180 s**
- frozen stream (app hang) → detected in 10 s, one transparent session retry
- WebRTC-blocking corporate network → fails fast (~8 s) with a clear
  `network-blocked` reason instead of an infinite spinner

### 4. Live stats (1 s cadence)

```js
stream.on('stats', (s) => …);
// { fps, latencyMs, bitrateKbps, resolution, codec, framesDecoded,
//   framesDropped, relayTransport: '' | 'udp' | 'tcp' | 'tls' }
```

The ⓘ button renders these; `relayTransport: 'tcp'/'tls'` is your cue to show
a "restricted network" notice.

### 5. Quality switching

```js
stream.allowedResolutions   // the project's ladder up to maxStreamQuality
stream.setResolution(1920, 1080)
```

### 6. Input to/from the Unreal app

```js
stream.send({ type: 'setColor', value: 'red' });   // → UE (emitUIInteraction)
stream.on('ueMessage', (m) => …);                  // ← UE (handle_responses)
stream.consoleCommand('stat fps');                 // UE console
```

### 7. On-screen keyboard (mobile text input)

When UE focuses a text field the SDK emits `osk`; this app opens an input
modal and answers with `sendTextboxEntry`:

```js
stream.on('osk', ({ contents }) => openModal(contents));
stream.sendTextboxEntry(typedText);
```

### 8. AFK countdown

```js
stream.on('afkWarning', (w) => {
  // w.kind === 'countdown' → show overlay with w.secondsRemaining + w.dismiss()
  // w.kind === 'dismissed' → hide it
});
```

### 9. Voice / text chat

Available when the ticket carries a `voiceToken` (chat enabled in the
dashboard). LiveKit loads only when this module is imported:

```js
import { VoiceChat } from '@streampixel/core/voice';

const chat = VoiceChat.for(stream, { userName, voice: false }); // join muted
await chat.join();
chat.on('message', (m) => …);        // { from, text, avatar }
chat.on('roster',  (r) => …);        // participants, speaking, micMuted, videoTrack
chat.on('typing',  (t) => …);
chat.sendMessage('hi');  chat.sendTyping();
chat.toggleMic(true);    chat.toggleCamera(true);   // video chat = camera + roster videoTracks
chat.leave();
```

The 💬 button (bottom-left) demonstrates lazy join, messages, typing
indicators, and mic toggle. Chat interops with share.streampixel.io viewers in
the same room.

### 10. Shared (SFU) viewing

```js
// Host page:
const host = await StreamPixel.create({ appId, container, shared: { role: 'host' } });
shareWithViewers(host.streamerId);
// Viewer pages:
StreamPixel.create({ appId, container, shared: { role: 'viewer', hostStreamerId } });
```

### 11. Utilities & dev tools

```js
await stream.getDiagnostics()   // full WebRTC snapshot + human verdict
stream.captureScreenshot()      // PNG data URL of the current frame
stream.setHoverMouse(true)      // hover vs locked mouse at runtime
stream.toggleXR()               // WebXR session (when the project enables XR)
stream.toggleAudio()            // drives the stream's audio element
stream.disconnect()             // deliberate end — never auto-reconnects
```

The terminal icon in the control bar opens this app's Developer Tools panel
(console commands, raw UI-interaction JSON, diagnostics, screenshot,
disconnect) — `window.spStream` is also exposed for the browser console.

---

## What changed from v1 (`streampixelsdk`)

| v1 | v2 |
|---|---|
| `StreamPixelApplication({...})` returns Epic internals | `StreamPixel.create({...})` returns a typed facade |
| Raw Epic event names (`webRtcConnected`, …) | One typed `state` machine + purposeful events |
| API key + config fetched from legacy endpoints | Server-minted **ticket**; no secrets in the browser |
| Reconnect/queue/AFK handled by every integrator | Built into the SDK; you render states |
| Mixpanel bundled | First-party telemetry only (`'standard'`/`'minimal'`) |
| `sfuHost: 'false'` string flags | Typed `shared: { role }` |
| Obfuscated bundle | Readable TypeScript, sourcemaps, `.d.ts` |

## Telemetry & privacy

The SDK reports session lifecycle + WebRTC quality to Streampixel's own
pipeline (token-authenticated; `telemetry: 'minimal'` restricts it to
lifecycle). **No third-party trackers.** These reports are what make sessions
debuggable in the Streampixel dashboard when a customer files a ticket.

## Troubleshooting

- **Black container, no loading UI** — you built custom UI and forgot to
  render on `state`; or pass `loading: true` for the SDK's minimal overlay.
- **`ws://localhost:3000/ws` in devtools** — that's webpack hot reload, not
  the SDK. The SDK's socket is `wss://<region-signalling>/?...&ticket=…`.
- **Telemetry rows red under DevTools throttling** — telemetry has a hard
  1.5 s timeout so it can never slow the stream; aborts under throttling are
  by design.
- **Chat button missing** — the project has chat disabled (no `voiceToken` on
  the ticket), or the stream hasn't reached `streaming` yet.
- **`osk` never fires** — the UE app must use Pixel Streaming's text-input
  widgets for the keyboard request to be sent.
