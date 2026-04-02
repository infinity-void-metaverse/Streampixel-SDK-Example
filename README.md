# StreamPixel Web SDK — Example Application

A React example demonstrating how to integrate the **StreamPixel Web SDK** to stream Unreal Engine content directly into a browser via WebRTC. This repo serves as both a working starter and a complete feature reference.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Features at a Glance](#features-at-a-glance)
- [Core Initialization & Configuration](#core-initialization--configuration)
- [Connection Management](#connection-management)
- [WebRTC Lifecycle Events](#webrtc-lifecycle-events)
- [SFU — One-to-Many Streaming](#sfu--one-to-many-streaming)
- [Video, Codec & Resolution](#video-codec--resolution)
- [Bitrate & Quality Control](#bitrate--quality-control)
- [Input Controls](#input-controls)
- [Audio](#audio)
- [AFK (Idle Timeout)](#afk-idle-timeout)
- [Queue System](#queue-system)
- [Reconnection](#reconnection)
- [Stream Statistics](#stream-statistics)
- [Sending Commands to Unreal Engine](#sending-commands-to-unreal-engine)
- [Receiving Responses from Unreal Engine](#receiving-responses-from-unreal-engine)
- [Voice & Text Chat](#voice--text-chat)
- [Custom Loading Screen](#custom-loading-screen)
- [UI Customization](#ui-customization)
- [Developer Tools Panel](#developer-tools-panel)
- [UIControl Methods Reference](#uicontrol-methods-reference)
- [URL Query Parameters](#url-query-parameters)
- [SDK Exports Reference](#sdk-exports-reference)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Quick Start

```bash
git clone <repo-url>
cd Streampixel-SDK-Example
npm install
npm start
```

Open `http://localhost:3000/<YOUR_PROJECT_ID>` — replace with your StreamPixel project ID from the dashboard.

---

## Project Structure

```
src/
├── index.js                  # React entry point — renders <App />
├── index.css                 # Global styles (loading, controls, stats, AFK, dev tools)
└── components/
    └── App.js                # Full example — all SDK features with Developer Tools panel
```

**`App.js`** demonstrates every SDK feature: loading screen, mute, fullscreen, stats, AFK handling, queue, reconnection, and a **Developer Tools panel** for console commands, textbox entry, UI interactions, connection control, microphone, resolution, and hovering mouse.

### Developer Tools Toggle

At the top of `App.js`, set `SHOW_DEV_TOOLS` to control visibility:

```js
const SHOW_DEV_TOOLS = true;  // Set to false to hide in production
```

---

## Features at a Glance

| Feature | Description | In Example | Via |
|---------|-------------|:----------:|-----|
| [Core Streaming](#core-initialization--configuration) | Initialize SDK, connect to UE instance | Yes | Auto |
| [Connection Management](#connection-management) | Connect, disconnect, reconnect | Yes | Dev Tools |
| [WebRTC Events](#webrtc-lifecycle-events) | Track connection lifecycle stages | Yes | Auto |
| [SFU Streaming](#sfu--one-to-many-streaming) | One-to-many broadcast mode | Yes | URL params |
| [Codec Selection](#video-codec--resolution) | AV1, H264, VP9, VP8 with fallback | Yes | Config |
| [Resolution Control](#video-codec--resolution) | Per-device, fixed/dynamic/crop modes | Yes | Dev Tools + Config |
| [Bitrate & Quality](#bitrate--quality-control) | Min/max bitrate, quantization parameters | Yes | Config |
| [Input Controls](#input-controls) | Mouse, keyboard, touch, gamepad, XR | Yes | Config |
| [Audio Playback](#audio) | Mute/unmute stream audio (dual-element) | Yes | Controls + Dev Tools |
| [Microphone Input](#audio) | Send mic audio to UE | Yes | Dev Tools |
| [AFK Timeout](#afk-idle-timeout) | Custom idle warning overlay | Yes | Auto |
| [Queue System](#queue-system) | Queue position tracking | Yes | Auto |
| [Auto-Reconnection](#reconnection) | Reconnect on drop with state events | Yes | Auto |
| [Stream Statistics](#stream-statistics) | FPS, bitrate, codec, RTT, resolution | Yes | Controls |
| [Console Commands](#sending-commands-to-unreal-engine) | Send UE console commands (`stat fps`, etc.) | Yes | Dev Tools |
| [UI Interaction](#sending-commands-to-unreal-engine) | Send custom JSON to UE | Yes | Dev Tools |
| [Textbox Entry](#sending-commands-to-unreal-engine) | Send text to focused UE text field | Yes | Dev Tools |
| [Receive from UE](#receiving-responses-from-unreal-engine) | Listen for custom UE responses | Yes | Auto |
| [Hovering Mouse](#input-controls) | Toggle mouse hover events at runtime | Yes | Dev Tools |
| [Voice & Text Chat](#voice--text-chat) | LiveKit-based voice rooms & messaging | — | SDK only |
| [Custom Loading Screen](#custom-loading-screen) | Fully configurable loading overlay | Yes | Config |
| [UI Customization](#ui-customization) | Hide default PS UI, custom controls | Yes | Auto |

> **Dev Tools** = Available in the Developer Tools panel (toggle via `SHOW_DEV_TOOLS` constant).
> **Config** = Available via SDK config options in the `StreamPixelApplication()` call.
> **SDK only** = Available in the SDK but not demonstrated in this example (see API reference below).

---

## Core Initialization & Configuration

### Basic Usage

```js
import { StreamPixelApplication } from 'streampixelsdk';

const { appStream, pixelStreaming, queueHandler, UIControl, reconnectStream } =
  await StreamPixelApplication({
    appId: "your_project_id",   // Required — from StreamPixel dashboard
    AutoConnect: true,
  });
```

### Understanding `appId`

The `appId` is the **only required parameter**. It resolves all server-side configuration automatically:

- Signaling server URL
- TURN server credentials
- UE instance pool & matchmaker routing
- Session auth / tokens

You don't need to configure signaling URLs, TURN servers, ICE configs, or auth tokens on the client.

### Full Configuration Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **`appId`** | `string` | **Required** | Project ID from StreamPixel dashboard |
| `AutoConnect` | `boolean` | `true` | Connect immediately on initialization |
| `streamerId` | `string` | Auto-generated | Target a specific streamer instance |
| `sfuHost` | `string` | `"false"` | SFU host mode (`"true"` / `"false"`) |
| `sfuPlayer` | `string` | `"false"` | SFU viewer mode (`"true"` / `"false"`) |
| `forceTurn` | `boolean` | `true` | Force TURN relay (helps behind strict firewalls) |
| `AutoPlayVideo` | `boolean` | `true` | Auto-play video on load |
| `StartVideoMuted` | `boolean` | `true` | Start with video audio muted |
| `primaryCodec` | `string` | From project | Preferred codec: `"AV1"` `"H264"` `"VP9"` `"VP8"` |
| `fallBackCodec` | `string` | From project | Fallback if primary not supported |
| `maxStreamQuality` | `string` | From project | Max resolution cap (e.g., `"720p (1280x720)"`) |
| `startResolution` | `string` | From project | Desktop starting resolution |
| `startResolutionMobile` | `string` | From project | Mobile starting resolution |
| `startResolutionTab` | `string` | From project | Tablet starting resolution |
| `resolutionMode` | `string` | From project | `"Fixed Resolution Mode"` `"Dynamic Resolution Mode"` `"Crop on Resize Mode"` |
| `resX` | `number` | From project | Custom resolution width (pixels) |
| `resY` | `number` | From project | Custom resolution height (pixels) |
| `resolution` | `boolean` | From project | Enable resolution control |
| `minBitrate` | `number` | From project | Minimum bitrate (Mbps) |
| `maxBitrate` | `number` | From project | Maximum bitrate (Mbps) |
| `minQP` | `number` | From project | Min quantization parameter (1–51, lower = better) |
| `maxQP` | `number` | From project | Max quantization parameter (-1 = no limit) |
| `mouseInput` | `boolean` | `false` | Enable mouse input |
| `keyBoardInput` | `boolean` | `false` | Enable keyboard input |
| `touchInput` | `boolean` | `false` | Enable touch input |
| `gamepadInput` | `boolean` | `false` | Enable gamepad/controller input |
| `xrInput` | `boolean` | `false` | Enable WebXR (VR/AR) input |
| `hoverMouse` | `boolean` | `false` | Send mouse hover/move events to UE |
| `fakeMouseWithTouches` | `boolean` | `false` | Convert touch events to mouse events |
| `useMic` | `boolean` | `false` | Enable microphone input (sent to UE) |
| `afktimeout` | `number` | From project | Idle timeout in seconds (1–7200) |

### Return Values

| Object | Description |
|--------|-------------|
| `appStream` | Application wrapper — DOM root, video lifecycle callbacks, overlays, stats panel |
| `pixelStreaming` | Core SDK — event listeners, connect/disconnect, codec/bitrate, input control |
| `queueHandler` | Register a callback to receive queue position updates |
| `UIControl` | UI helpers — toggle audio, change resolution, toggle hover mouse, get stats |
| `reconnectStream` | Reconnection lifecycle — emits state events on auto-reconnect |

---

## Connection Management

### Auto-Connect (Default)

```js
await StreamPixelApplication({ appId: "...", AutoConnect: true });
// Connection starts immediately
```

### Manual Connect / Disconnect / Reconnect

```js
const { pixelStreaming } = await StreamPixelApplication({ appId: "...", AutoConnect: false });

// Connect manually
pixelStreaming.connect();

// Disconnect the stream
pixelStreaming.disconnect();

// Reconnect after disconnect
pixelStreaming.reconnect();
```

> **Example:** The Developer Tools panel provides Connect, Reconnect, and Disconnect buttons.

### Force TURN Relay

For users behind strict firewalls or symmetric NAT:

```js
StreamPixelApplication({ appId: "...", forceTurn: true });
```

### Target a Specific Streamer

```js
StreamPixelApplication({ appId: "...", streamerId: "myInstance123" });
```

Or via URL: `http://localhost:3000/PROJECT_ID?streamerId=myInstance123`

---

## WebRTC Lifecycle Events

The SDK fires events as the WebRTC connection progresses. Use them to drive UI state, loading screens, or custom logic.

```js
pixelStreaming.addEventListener('webRtcAutoConnect',  () => { /* Auto-connect started */ });
pixelStreaming.addEventListener('webRtcConnecting',   () => { /* Peer connection opening */ });
pixelStreaming.addEventListener('webRtcSdp',          () => { /* SDP offer/answer exchanged */ });
pixelStreaming.addEventListener('webRtcConnected',    () => { /* Peer connection established */ });
pixelStreaming.addEventListener('streamLoading',      () => { /* Stream data arriving */ });
pixelStreaming.addEventListener('playStream',         () => { /* Video about to play */ });
pixelStreaming.addEventListener('videoInitialized',   () => { /* Stream is live */ });
pixelStreaming.addEventListener('webRtcFailed',       () => { /* Connection failed */ });
pixelStreaming.addEventListener('webRtcDisconnected', () => { /* Connection lost */ });
```

**Connection flow:**

```
webRtcAutoConnect → webRtcConnecting → webRtcSdp → webRtcConnected → streamLoading → playStream → videoInitialized
                                                                                                      ↓
                                                                                            Stream is live!
```

### Video Initialized Callback

Called when the stream video element is ready in the DOM:

```js
appStream.onVideoInitialized = () => {
  // Append the stream to your container
  videoRef.current.append(appStream.rootElement);

  // Access the video element
  const video = appStream.stream.videoElementParent.querySelector("video");
};

appStream.onDisconnect = () => {
  console.log("Disconnected");
};
```

---

## SFU — One-to-Many Streaming

SFU (Selective Forwarding Unit) enables **one UE instance to be viewed by multiple users** simultaneously.

```
                    ┌──── Viewer 1 (sfuPlayer=true)
UE Instance ───→ SFU Server ──── Viewer 2 (sfuPlayer=true)
(sfuHost=true)      └──── Viewer 3 (sfuPlayer=true)
```

### Roles

| Role | Config | Description |
|------|--------|-------------|
| **Host** | `sfuHost: "true"` | Controls the UE instance. Only one host per session. |
| **Viewer** | `sfuPlayer: "true"` | Watches the host's stream. Multiple viewers allowed. |
| **Default** | (neither) | Standard 1:1 mode — each user gets their own UE instance. |

### Usage

```js
// Host:
StreamPixelApplication({ appId: "...", sfuHost: "true" });

// Viewer:
StreamPixelApplication({ appId: "...", sfuPlayer: "true" });
```

Or via URL:
```
Host:    https://yourdomain.com/PROJECT_ID?sfuHost=true
Viewer:  https://yourdomain.com/PROJECT_ID?sfuPlayer=true&streamerId=hostInstance123
```

### When to Use SFU

- Presentations / demos — one person controls, audience watches
- Live events — stream a virtual experience to many viewers
- Spectator mode — let others watch a session
- Cost optimization — share one UE instance across many viewers

---

## Video, Codec & Resolution

### Codec Selection

The SDK supports automatic codec negotiation with fallback:

```js
StreamPixelApplication({
  appId: "...",
  primaryCodec: "AV1",       // Preferred: "AV1" | "H264" | "VP9" | "VP8"
  fallBackCodec: "H264",     // Used if primary not supported by browser
});
```

Codec fallback logic: Primary → Fallback → H264 (default). AV1 requires UE > 5.3.

### Resolution

```js
StreamPixelApplication({
  appId: "...",
  maxStreamQuality: "1080p (1920x1080)",

  // Per-device starting resolution (auto-detected):
  startResolution: "1080p (1920x1080)",       // Desktop
  startResolutionMobile: "480p (854x480)",     // Mobile
  startResolutionTab: "720p (1280x720)",       // Tablet

  // Resolution mode:
  resolutionMode: "Fixed Resolution Mode",
  // Options:
  //   "Fixed Resolution Mode"    — stream at exact resolution
  //   "Dynamic Resolution Mode"  — adapt to viewport size
  //   "Crop on Resize Mode"      — crop instead of stretch

  // Custom resolution (alternative to preset strings):
  resX: 1920,
  resY: 1080,
  resolution: true,           // Enable resolution control
});
```

**Available presets:** `"360p (640x360)"` | `"480p (854x480)"` | `"720p (1280x720)"` | `"1080p (1920x1080)"` | `"1440p (2560x1440)"` | `"4K (3840x2160)"`

### Device Detection

The SDK automatically detects mobile, tablet, and desktop devices and applies the corresponding `startResolution` setting.

---

## Bitrate & Quality Control

```js
StreamPixelApplication({
  appId: "...",
  minBitrate: 1,       // Minimum bitrate (Mbps)
  maxBitrate: 100,     // Maximum bitrate (Mbps)
  minQP: 20,           // Min quantization parameter (1–51, lower = better quality)
  maxQP: -1,           // Max quantization parameter (-1 = no limit)
});
```

---

## Input Controls

Enable specific input methods via config flags:

```js
StreamPixelApplication({
  appId: "...",
  mouseInput: true,            // Mouse clicks and position
  keyBoardInput: true,         // Keyboard events
  touchInput: true,            // Touch events (mobile/tablet)
  gamepadInput: false,         // Gamepad/controller input
  xrInput: false,              // WebXR (VR/AR) controller input
  hoverMouse: true,            // Send mouse move/hover events to UE
  fakeMouseWithTouches: false, // Convert touch events to mouse events
});
```

### Runtime Toggle — Hovering Mouse

```js
UIControl.toggleHoveringMouse(true);   // Enable hover events
UIControl.toggleHoveringMouse(false);  // Disable hover events
```

> **Example:** The Developer Tools panel has Enable/Disable buttons for hovering mouse.

---

## Audio

### Stream Audio (Playback)

The SDK creates **two separate media elements** — a `<video>` element and a separate `<audio>` element. To properly mute/unmute, you must target both:

```js
// Mute/unmute video element
const video = appStream.stream.videoElementParent.querySelector("video");
video.muted = false;

// Mute/unmute the SDK's separate audio element
const audioEl = appStream.stream._webRtcController.streamController.audioElement;
audioEl.muted = false;
if (audioEl.paused) audioEl.play(); // Handle browser autoplay policy
```

Or use the UIControl shortcut:

```js
UIControl.toggleAudio(); // Toggles both elements
```

### Microphone Input (Send to UE)

Send the user's microphone audio to the Unreal Engine instance:

```js
// Enable via config:
StreamPixelApplication({ appId: "...", useMic: true });

// Or enable at runtime:
await navigator.mediaDevices.getUserMedia({ audio: true });
pixelStreaming.unmuteMicrophone(true);
```

> **Example:** The Developer Tools panel has an "Enable Mic" button that requests microphone access and sends it to UE.

---

## AFK (Idle Timeout)

When the user is idle, the SDK triggers a warning before disconnecting. Configure the timeout and handle the events:

### Configuration

```js
StreamPixelApplication({
  appId: "...",
  afktimeout: 120, // Seconds (1–7200)
});
```

### Events

```js
pixelStreaming.addEventListener('afkWarningActivate', (e) => {
  // e.data.countDown — seconds remaining
  // e.data.dismissAfk — callback to reset the timer
  showWarning(e.data.countDown);
  dismissRef.current = e.data.dismissAfk;
});

pixelStreaming.addEventListener('afkWarningUpdate', (e) => {
  updateCountdown(e.data.countDown); // Fires every second
});

pixelStreaming.addEventListener('afkWarningDeactivate', () => {
  hideWarning(); // User interacted, warning dismissed
});

pixelStreaming.addEventListener('afkTimedOut', () => {
  // Session disconnected due to inactivity
});
```

### Custom Overlay

The example replaces the default black-screen AFK overlay with a custom card UI featuring a countdown timer and "I'm still here" button. The default overlay is hidden via:

```css
#afkOverlay { display: none !important; }
```

---

## Queue System

When all UE instances are busy, users are placed in a queue. The `queueHandler` callback fires with position updates:

```js
const { queueHandler } = await StreamPixelApplication({ appId: "..." });

queueHandler((msg) => {
  console.log("Queue position:", msg.position); // 1, 2, 3, ...
  console.log("Message:", msg.message);          // "You are in Queue"
});
```

The example shows the queue position automatically in the loading screen with a badge.

---

## Reconnection

The SDK automatically attempts to reconnect when the connection drops. The `reconnectStream` object emits state events:

```js
const { reconnectStream } = await StreamPixelApplication({ appId: "..." });

reconnectStream.on("state", (data) => {
  // data.status — current reconnection state
  // data.code   — disconnect code (e.g., 4007)
  // data.reason — disconnect reason string

  switch (data.status) {
    case "connecting":    // Initial reconnect attempt
    case "reconnecting":  // Reconnect in progress
    case "retrying":      // Retrying after a failed attempt
    case "connected":     // Successfully reconnected
    case "disconnected":  // Connection dropped
    case "failed":        // All reconnect attempts exhausted (after ~60s)
  }
});
```

### Reconnection Flow

```
Connection lost → reconnecting → retrying (1..N) → connected → stream resumes
                                       ↓
                                    failed (all retries exhausted)
```

> **Example:** `App.js` wires reconnection states into the loading screen for seamless user feedback.

---

## Stream Statistics

### Receiving Stats via Event

Stats are delivered periodically through the `statsReceived` event:

```js
pixelStreaming.addEventListener('statsReceived', (e) => {
  const stats = e.data.aggregatedStats;
  // stats.inboundVideoStats — bitrate, resolution, FPS, codec, frames, packets
  // stats.inboundAudioStats — bitrate, codec
  // stats.sessionStats      — RTT, duration
  // stats.streamStats       — bytes received
  // stats.codecs            — Map<codecId, { mimeType }> for codec name resolution
});
```

### Available Stat Fields

| Stat | Source | Description |
|------|--------|-------------|
| Video Bitrate (kbps) | `inboundVideoStats.bitrate` | Current video bitrate |
| Audio Bitrate (kbps) | `inboundAudioStats.bitrate` | Current audio bitrate |
| Video Resolution | `frameWidth` x `frameHeight` | Stream resolution |
| Framerate (FPS) | `framesPerSecond` | Current frame rate |
| Frames Decoded | `framesDecoded` | Total frames decoded |
| Frames Dropped | `framesDropped` | Total frames dropped |
| Packets Lost | `packetsLost` | Total packets lost |
| Video Codec | Resolved from `codecs` Map | e.g., AV1, H264, VP9 |
| Audio Codec | Resolved from `codecs` Map | e.g., opus |
| Net RTT (ms) | `currentRoundTripTime * 1000` | Network round-trip time |
| Decode Time (ms) | `totalDecodeTime / framesDecoded` | Average decode time |
| Jitter Buffer (ms) | `jitterBufferDelay / emittedCount` | Jitter buffer delay |
| Video QP | `qpSum` | Quantization parameter |
| Duration | `sessionStats.duration` | Session duration |

### Codec Name Resolution

Codec IDs in stats (e.g., `RTCCodec_0_Inbound_96`) must be resolved via the `codecs` Map:

```js
const codecId = stats.inboundVideoStats.codecId;
const mimeType = stats.codecs.get(codecId).mimeType; // "video/AV1"
const codecName = mimeType.replace('video/', '');      // "AV1"
```

The example includes an `extractPSStats()` helper that does this automatically.

### Triggering Stats Collection

```js
UIControl.getStreamStats(); // Triggers collection — listen via statsReceived event
```

---

## Sending Commands to Unreal Engine

Three methods to communicate with your UE application:

### 1. UI Interaction — Custom JSON

Send arbitrary JSON payloads to your UE Blueprint/C++ handler:

```js
appStream.stream.emitUIInteraction({
  message: { type: "setResolution", value: "1080p (1920x1080)" }
});
```

> **Example:** The Developer Tools panel lets you type and send custom JSON payloads to UE.

### 2. Console Command

Execute UE console commands remotely:

```js
pixelStreaming.emitConsoleCommand("stat fps");
pixelStreaming.emitConsoleCommand("r.SetRes 1920x1080f");
```

### 3. Text Input

Send text as if typed into a focused UE text field:

```js
pixelStreaming.sendTextboxEntry("Hello from the web!");
```

---

## Receiving Responses from Unreal Engine

Listen for custom messages sent from your UE application (Blueprint or C++):

```js
pixelStreaming.addResponseEventListener('handle_responses', (response) => {
  const data = JSON.parse(response);
  console.log("UE says:", data);
  // Handle your custom UE → Web messages here
});
```

The example registers this listener after SDK initialization.

---

## Voice & Text Chat

> **Note:** Voice & text chat is available in the SDK but is **not demonstrated in this example**. The API reference below shows how to integrate it in your own application.

The SDK includes a **LiveKit-based voice and text chat** system via the `StreamPixelVoiceChat` class.

### Initialization

```js
import { StreamPixelVoiceChat } from 'streampixelsdk';

const voiceChat = new StreamPixelVoiceChat(
  roomName,    // string — chat room identifier
  userName,    // string — display name
  voiceChat,   // boolean — enable voice chat
  avatar,      // string — avatar URL or SVG string
  micStart     // boolean — start with mic enabled
);
```

### Methods

| Method | Description |
|--------|-------------|
| `voiceChat.join()` | Join the voice/text chat room |
| `voiceChat.leave()` | Leave the chat room |
| `voiceChat.toggleMic()` | Toggle local microphone on/off |
| `voiceChat.sendMessage(text)` | Send a text message to the room |
| `voiceChat.muteAllRemote()` | Mute all remote participants (local only) |
| `voiceChat.unmuteAllRemote()` | Unmute all remote participants |
| `voiceChat.muteSelected(identity)` | Mute a specific participant |
| `voiceChat.unmuteSelected(identity)` | Unmute a specific participant |

### Event Callbacks

```js
// Receive text messages
voiceChat.onMessage((msg) => {
  // msg.from — sender name
  // msg.text — message content
  // msg.avatar — sender's avatar
});

// Track participants (join/leave/speaking)
voiceChat.onParticipantUpdate((participants) => {
  // participants.localParticipant — { id, avatar, speaking }
  // participants.remoteParticipants — [{ id, avatar, speaking }]
});
```

### Audio Groups

Audio groups let users selectively mute/unmute individual participants. When you mute someone, it silences their audio from your end, but they can still hear you. Use `muteSelected(identity)` / `unmuteSelected(identity)` for individual control, or `muteAllRemote()` / `unmuteAllRemote()` for bulk control.

---

## Custom Loading Screen

The loading screen is fully customizable via the `LOADING_CONFIG` object:

```js
const LOADING_CONFIG = {
  backgroundColor: '#18181A',
  accentColor: '#4e9cff',
  logoUrl: null,                     // e.g., '/Images/logo.png'
  title: 'Connecting to Stream',
  subtitle: 'Please wait...',
  disconnectedSubtitle: 'The stream session has ended.',
  showSpinner: true,
  queueMessage: (pos) => `You are in queue at position ${pos}`,

  statusMessages: {
    initializing:     'Initializing...',
    connecting:       'Connecting to server...',
    webRtcConnecting: 'Establishing WebRTC connection...',
    sdpNegotiation:   'Negotiating stream parameters...',
    webRtcConnected:  'WebRTC connected, loading stream...',
    streamLoading:    'Stream is loading...',
    playingStream:    'Starting video playback...',
    inQueue:          'Waiting in queue...',
    failed:           'Connection failed. Please try again.',
    disconnected:     'Disconnected from stream.',
    reconnecting:     'Reconnecting to stream...',
    retrying:         'Retrying connection...',
    reconnected:      'Reconnected! Loading stream...',
    reconnectFailed:  'Unable to reconnect. Please refresh the page.',
  },

  // Reconnection screen text:
  reconnectingTitle:       'Reconnecting',
  reconnectingSubtitle:    'Please wait while we restore your session...',
  reconnectedTitle:        'Reconnected',
  reconnectFailedTitle:    'Reconnection Failed',
  reconnectFailedSubtitle: 'We were unable to restore your session.',
};
```

The loading screen automatically:
- Shows a **progress bar** that advances with each WebRTC lifecycle event
- Displays **queue position** with a badge when waiting
- Updates title/subtitle for **disconnect** and **failure** states
- Hides spinner and progress bar on terminal states

### Adding Custom Elements

```jsx
{/* Inside the loading overlay JSX */}
<div className="loading-actions">
  <button className="loading-btn" onClick={() => alert('Hello!')}>
    Custom Button
  </button>
</div>
```

---

## UI Customization

### Hiding the Default Pixel Streaming UI

The SDK ships with a built-in overlay (settings, stats, fullscreen buttons). The example hides it:

```css
#uiFeatures { display: none !important; }
#afkOverlay { display: none !important; }
```

Plus JS-based hiding after SDK init:

```js
const uiEl = appStream.rootElement?.querySelector('#uiFeatures');
if (uiEl) uiEl.style.display = 'none';
```

### CSS Sections

All styles are in `src/index.css` with clear section headers:

| Section | Classes |
|---------|---------|
| Loading Screen | `.loading-overlay`, `.loading-spinner`, `.loading-title`, `.loading-progress-*` |
| Stream Controls | `.stream-controls`, `.control-btn`, `.control-btn-active` |
| Stats Popup | `.stats-popup`, `.stats-row`, `.stats-label`, `.stats-value` |
| AFK Overlay | `.afk-overlay`, `.afk-card`, `.afk-countdown`, `.afk-btn` |
| Developer Tools | `.dev-tools-popup`, `.dev-tools-section`, `.dev-tools-btn`, `.dev-tools-input` |

### Adding Custom Control Buttons

```jsx
<div className="stream-controls">
  {/* ... existing buttons ... */}
  <button className="control-btn" onClick={myHandler} title="My Button">
    <svg>...</svg>
  </button>
</div>
```

---

## Developer Tools Panel

The example includes a built-in Developer Tools panel that demonstrates advanced SDK features. Toggle it with the terminal icon button in the bottom-right controls.

### Visibility Toggle

```js
// At the top of App.js:
const SHOW_DEV_TOOLS = true;  // Set to false to hide entirely in production
```

When `SHOW_DEV_TOOLS` is `false`, both the toggle button and the panel are completely removed from the DOM.

### Panel Sections

| Section | What It Does | SDK Method |
|---------|-------------|------------|
| Console Command | Send UE console commands (e.g., `stat fps`) | `pixelStreaming.emitConsoleCommand()` |
| UI Interaction | Send custom JSON to UE Blueprint/C++ | `appStream.stream.emitUIInteraction()` |
| Connection | Disconnect the stream | `pixelStreaming.disconnect()` |
| Audio | Toggle stream audio, enable microphone | `UIControl.toggleAudio()`, `pixelStreaming.unmuteMicrophone()` |
| Resolution | Switch between 480p / 720p / 1080p / 1440p | `UIControl.handleResMax()` |
| Hovering Mouse | Enable/disable mouse hover events | `UIControl.toggleHoveringMouse()` |

---

## UIControl Methods Reference

| Method | Parameters | Description |
|--------|-----------|-------------|
| `toggleAudio()` | — | Toggle stream audio on/off (both video and audio elements) |
| `handleResMax(value)` | `string` e.g. `"1280x720"` | Set maximum stream resolution |
| `toggleHoveringMouse(value)` | `boolean` | Enable/disable mouse hover events sent to UE |
| `getStreamStats()` | — | Trigger stats collection (receive via `statsReceived` event) |
| `getResolution()` | — | Get available resolution options (if enabled in config) |

```js
UIControl.toggleAudio();
UIControl.handleResMax('1920x1080');
UIControl.toggleHoveringMouse(true);
UIControl.getStreamStats();
```

---

## URL Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `streamerId` | `string` | — | Connect to a specific streamer instance |
| `sfuHost` | `string` | `"false"` | Enable SFU host mode |
| `sfuPlayer` | `string` | `"false"` | Enable SFU player/viewer mode |

Example: `http://localhost:3000/PROJECT_ID?sfuPlayer=true&streamerId=myHost`

---

## SDK Exports Reference

The SDK re-exports these classes from Epic Games' Pixel Streaming libraries for advanced use cases:

### Core

| Export | Description |
|--------|-------------|
| `StreamPixelApplication` | Main SDK entry point |
| `StreamPixelVoiceChat` | Voice & text chat class |
| `PixelStreaming` | Core Pixel Streaming controller |
| `WebRtcPlayerController` | WebRTC player control |
| `WebXRController` | WebXR input controller |
| `Config` | Configuration manager |

### Settings

`SettingBase`, `SettingFlag`, `SettingNumber`, `SettingOption`, `SettingText`
`SettingUIBase`, `SettingUIFlag`, `SettingUINumber`, `SettingUIOption`, `SettingUIText`

### UI / Overlays

| Export | Description |
|--------|-------------|
| `Application` | Base application class |
| `ConfigUI` | Configuration UI panel |
| `AFKOverlay`, `ActionOverlay`, `ConnectOverlay`, `DisconnectOverlay` | Overlay components |
| `ErrorOverlay`, `InfoOverlay`, `PlayOverlay`, `TextOverlay`, `OverlayBase` | Additional overlays |

### Statistics

`AggregatedStats`, `InboundVideoStats`, `InboundAudioStats`, `DataChannelStats`, `CandidatePairStats`, `CandidateStat`

### Utilities

| Export | Description |
|--------|-------------|
| `Logger` | Logging utility |
| `MessageRegistry` | Message handling |
| `SignallingProtocol` | Signalling protocol handler |
| `AfkLogic` | AFK detection logic |
| `LatencyTestResults` | Latency test data |
| `Flags`, `ControlSchemeType`, `NumericParameters`, `TextParameters` | Enums & constants |

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Black screen, no video | Incorrect project ID or UE not running | Verify `appId` and check StreamPixel dashboard |
| Audio not working | Separate `<audio>` element not unmuted | Mute both video + audio elements (see [Audio](#audio)) |
| Stats show `[object Object]` | Raw AggregatedStats has nested objects | Use `extractPSStats()` to flatten them |
| Default PS UI showing | `#uiFeatures` not hidden | Add CSS rule `#uiFeatures { display: none !important; }` |
| Codec shows raw ID | Using `codecId` directly | Look up `stats.codecs.get(codecId).mimeType` |
| AFK black screen | Default AFK overlay visible | Add `#afkOverlay { display: none !important; }` and handle AFK events |
| Connection fails behind firewall | WebRTC peer-to-peer blocked | Set `forceTurn: true` in SDK config |
| "Connecting..." on disconnect | Title/subtitle not updated | Use separate state for `loadingTitle` / `loadingSubtitle` |

---

## License

This example is provided for integration reference. The StreamPixel Web SDK is proprietary — see your StreamPixel license agreement for terms.
