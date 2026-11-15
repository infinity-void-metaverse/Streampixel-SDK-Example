# Streampixel Web SDK example (v2, `@streampixel/web-sdk`)

A React reference integration of the **Streampixel Web SDK v2**. It puts the stream of a Streampixel project inside a page and draws every screen a viewer needs around it: loading and queue, password form, "Click to start", idle warning, text input for phones, reconnecting, the end message, plus stats, a quality picker, chat and developer tools.

The SDK draws nothing except the video. Every screen in this app is example code in [src/components/App.js](src/components/App.js) that you own: copy it, restyle it, or replace it.

> **Pre-release.** `@streampixel/web-sdk` is not on npm yet, so this repository installs it from a tarball in [vendor/](vendor). The app is written against version 2.0.0-alpha.11.

**The full reference is the SDK's own README.** It ships inside the package: after `npm install`, open `node_modules/@streampixel/web-sdk/README.md` (options, states, events, errors, end codes, shared sessions, chat, telemetry) and `MIGRATION.md` next to it (moving from the v1 SDK). This file only explains the example.

## Run it

```bash
npm install
npm start
# open http://localhost:3000/<projectId>      (or /?appId=<projectId>)
```

`<projectId>` is the project id from the Streampixel dashboard. `npm run build` makes the production build; [vercel.json](vercel.json) sends every path to `index.html` so that `/<projectId>` works when deployed.

URL parameters of this example:

| Parameter | Meaning |
|---|---|
| `?platform=staging` | Use the staging platform instead of production (for SDK development). |
| `?shared=host` | Shared session, host role: owns the session and the input. |
| `?shared=viewer&hostStreamerId=<id>` | Watch a host's session. `<id>` is the host's streamer id (Developer Tools → Session on the host's page). |
| `?streamerId=<id>` | Use your own id for this connection. |
| `?engine=beta` | Run the next engine release instead of the stable one. |

## The package and the engine

The package you install is a small **loader**. The **engine**, the code that runs the stream, is downloaded by `StreamPixel.create()` from `https://js.streampixel.io` (mirror: `https://js-backup.streampixel.io`), signed and integrity-checked. Three consequences:

- **The engine can be older or newer than the package.** `SDK_VERSION` is the package, `stream.engineVersion` is the engine; the app shows both in Developer Tools. What this app uses is the behaviour of engine 2.0.0-alpha.11: on an older engine some of it is missing (for example the stats fields `packetsLost` and `bytesReceived`, and the end codes 4100 to 4104).
- **If the engine cannot be downloaded, `create()` rejects with `EngineLoadError`.** There is no copy in the package. The app shows "The player could not be loaded" with `err.reason` and a "Try again" button.
- **A Content-Security-Policy must allow the hosts**, and the page must be served over `https` or from `localhost`:

  ```
  script-src  https://js.streampixel.io https://js-backup.streampixel.io;
  connect-src https://*.streampixel.io wss://*.streampixel.io;
  ```

  Chat also needs `wss://*.livekit.cloud https://*.livekit.cloud` in `connect-src`.

## Starting and stopping a stream in React

```js
useEffect(() => {
  const ac = new AbortController();
  let stream, unsubscribe;

  StreamPixel.create({ appId, container: ref.current, signal: ac.signal })
    .then((s) => { stream = s; unsubscribe = subscribe(s); })   // attach listeners right away
    .catch((err) => { if (err.name !== 'AbortError') showError(err); });

  return () => {
    unsubscribe?.();   // destroy() announces `ended` before it drops listeners
    ac.abort();        // before create() resolves: nothing starts. After: the stream is destroyed.
    stream?.destroy(); // a stream that has already ended no longer follows the signal
  };
}, [appId, runId]);
```

Pass `signal` and abort it in the cleanup. React runs an effect twice in development under `<StrictMode>` (this app keeps StrictMode on), and a fast route change unmounts a component before `create()` has resolved. Without the signal, each of those leaves a session streaming with nobody watching.

`ended` is final: a stream has no `connect()` or `reconnect()`. To start again, destroy the stream and create a new one. The app does this by changing `runId`, which re-runs the effect ("Start again" on the end card, "Try again" after a failed `create()`).

## What the app shows, and where

| Feature | In `App.js` | SDK README section |
|---|---|---|
| Start, stop, start again | the effect "Start a stream", `restart` | React; Methods and properties → Session |
| `create()` failed: `AuthError` kinds, `EngineLoadError`, wrong option | `describeCreateError` | Errors from `create()` |
| Loading, queue, reconnecting, recovering | `onState`, the `progress` and `queue` listeners | States; Reconnecting and recovery |
| Password form | `passwordGate`, `handlePasswordSubmit`, `passwordMessage` | Access → Password projects |
| "Click to start" when the browser blocks autoplay | `needsPlay`, `handlePlay` | States (`awaitingPlay`) |
| End card | the `ended` listener | How a session ends, and end codes |
| Stats popup | the `stats` listener | Events → `StreamStats` |
| Quality picker | `handleResolutionChange` | Methods and properties → Video, sound and input |
| Idle warning | the `afkWarning` listener | Events |
| Text input for phones | the `osk` and `oskHide` listeners, `submitOsk` | Events |
| Links and files sent by the application, relay notice | the `openUrl`, `fileProgress`, `file` and `relayFallback` listeners | Events |
| Voice and text chat | `openChat` | Voice, text and video chat |
| Shared sessions | `readUrlOptions` | Shared sessions |
| Messages and console commands to the application | Developer Tools handlers | Methods and properties → Talking to your application |

Things worth knowing when you copy from it:

- **States.** The app switches on `state.kind`: `idle`, `awaitingPassword`, `connecting`, `queued`, `streaming`, `awaitingPlay`, `recovering`, `reconnecting`, `ended`. Keep a `default` branch: a newer engine may add a kind.
- **Passwords are a state, not an error.** On a password project `create()` resolves with `stream.state.kind === 'awaitingPassword'`, so render `stream.state` right after `create()`. Answer with `stream.submitPassword(text)`. It resolves for a right and for a wrong password; the state's `wrong`, `locked`, `hard` and `retryAfterSec` say what happened.
- **Single sign-on needs no code.** The SDK sends the browser to the sign-in page and finishes the sign-in on the next `create()`. A refused sign-in rejects with kind `sso-failed`; the app shows its `message` and a "Sign in again" button for `ssoStartUrl`.
- **The end message comes from the SDK.** `ended` carries `message`, a sentence for the viewer, with `code`, `reason` and `endKind` for your logs.
- **`send()`, `consoleCommand()` and `setResolution()` say whether anything was sent.** Nothing is queued: `send()` returns `false` before the video is up. `setResolution()` returns the size that was sent, or `null`.
- **Some events have a built-in action that runs only without a listener.** The app listens to `openUrl` and `file` (it shows a button, which phones and tablets need), and leaves `screenshot` to the SDK, which downloads the frame.
- **`VoiceChat.for()` returns a Promise**: `const chat = await VoiceChat.for(stream, { userName })`. The chat code is downloaded on first use. If you set `advanced.platformHost` on the stream, pass the same host to the chat.
- **Units.** `bitrate` is in kilobits per second: `{ min: 1_000, max: 20_000 }` is 1 to 20 Mbps.

## Access: "Your app only"

Public, password and single sign-on projects work in this app as it is. A project set to **Your app only** in the dashboard rejects with `AuthError` kind `server-ticket-required`: it only starts with a ticket that your own server requested.

1. Your server calls `POST https://platform.streampixel.io/api/v1/stream/ticket` with the project's **server key** in the `x-server-key` header, after your own sign-in check. The server key never goes in a page.
2. Your page passes **the whole response object** to the SDK: `auth: { mode: 'ticket', ticket }`. The ticket string alone is refused.
3. Request a new ticket for every `create()`, a page reload included.

The server code is in the SDK README, section "Your app only".

## Updating the vendored SDK

```bash
# in the SDK repository (packages/core)
npm run build && npm pack

# here
git rm vendor/streampixel-web-sdk-*.tgz
cp <path>/streampixel-web-sdk-<version>.tgz vendor/
npm install ./vendor/streampixel-web-sdk-<version>.tgz
```

Change the version whenever the content of the tarball changes: npm, Vercel and CI cache by name and version, so the same version with different bytes gives a stale install. Once the package is on npm, the `file:` dependency becomes a normal version range.

## Troubleshooting

- **"The player could not be loaded"**: `EngineLoadError`. The reason is on the card: usually the network, an ad blocker, or a Content-Security-Policy that does not allow the two engine hosts.
- **Black container, no screens**: the SDK draws only the video. Render the states yourself, as this app does, or mount `@streampixel/ui`.
- **Two sessions start in development**: `create()` was called without `signal`, or the cleanup does not abort it.
- **The session ends with code `1008` as soon as it connects**: the page's origin is not in the project's allowed-domains list. The platform compares the exact origin.
- **`send()` or `consoleCommand()` returns `false`**: the stream is not up yet. For console commands, the application must also be launched with `-AllowPixelStreamingCommands`.
- **Chat button missing**: the project has chat switched off (`stream.voiceToken` is `undefined`), or the stream is not up yet.
- **Waiting in the queue**: no GPU is free yet; the `queue` event carries the position.
- **`ws://localhost:3000/ws` in the browser's developer tools**: webpack's hot reload, not the SDK.
- **Failed telemetry requests under network throttling**: each telemetry request has a 1.5 second limit so that it never delays the stream.
