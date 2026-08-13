# Streampixel SDK Example (v2 — @streampixel/core)

Reference React integration for the Streampixel Web SDK v2. The SDK is
**headless** — every pixel of UI in this app (loading screen, password gate,
queue badge, AFK overlay, controls, stats, dev tools) is example code in
[src/components/App.js](src/components/App.js) that you own and can restyle
or replace.

## Run it

```bash
npm install
npm start
# open http://localhost:3000/<projectId>        (or /?appId=<projectId>)
```

URL parameters:

| Param | Meaning |
|---|---|
| `?platform=prod` | Target production (default is **staging** while v2 is pre-GA) |
| `?shared=host` | Shared (SFU) viewing — host role |
| `?shared=viewer&hostStreamerId=<id>` | Shared viewing — watch a host's session |
| `?streamerId=<id>` | Pin a specific streamer (session affinity) |

## Local SDK development (linked)

`package.json` links the SDK from a sibling checkout:

```json
"@streampixel/core": "file:../SDK-GENERATOR/packages/core"
```

Edit SDK source in `SDK-GENERATOR/packages/core/src/`, run `npm run build`
there, and restart/refresh this app — both repos develop together. When v2
publishes to npm, replace the `file:` link with a version range.

## The integration, in short

```js
import { StreamPixel, AuthError } from '@streampixel/core';

const stream = await StreamPixel.create({
  appId,
  container: videoRef.current,
  // auth: { mode: 'password', password },   // password-gated projects
  // shared: { role: 'host' },               // SFU shared viewing
});

stream.on('state',  (s) => { /* resolving → queued → connecting → streaming */ });
stream.on('queue',  ({ position }) => {});
stream.on('stats',  (s) => { /* fps, latencyMs, codec, bitrateKbps, relayTransport */ });
stream.on('afkWarning', (w) => { /* countdown + w.dismiss() */ });
stream.on('osk',    ({ contents }) => stream.sendTextboxEntry(prompt('Enter text', contents)));
stream.on('ended',  ({ code, reason, endKind }) => {});

stream.send({ any: 'ui interaction' });   // → UE
stream.consoleCommand('stat fps');
stream.disconnect();
```

`AuthError.kind` tells the UI exactly what to show: `password-required`,
`password-wrong`, `sso-required` (auto-redirects by default), `project-offline`,
`project-not-found`.

## What changed from v1

- `StreamPixelApplication({...})` → `StreamPixel.create({...})` with typed
  options and a typed state machine (no more raw Epic lib event names).
- Tickets: auth happens server-side at session mint; no API keys in the browser.
- The SDK reconnects itself (180 s window), watches for frozen streams, and
  fails fast with a clear message on WebRTC-blocking networks.
- Telemetry is first-party only (no Mixpanel), token-authenticated.
- `sfuHost`/`sfuPlayer` strings → typed `shared: { role }` option.
