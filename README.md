# StreamPixel Web SDK — Example Application

A comprehensive React example showing how to integrate the **StreamPixel Web SDK** to stream Unreal Engine content directly into a browser. This repo is designed as both a working starter and a reference guide — every SDK feature is demonstrated with inline comments explaining what it does and how to customize it.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Project ID & URL Routing](#project-id--url-routing)
- [SDK Configuration Options](#sdk-configuration-options)
- [SFU (Selective Forwarding Unit)](#sfu-selective-forwarding-unit)
- [Custom Loading Screen](#custom-loading-screen)
- [WebRTC Lifecycle Events](#webrtc-lifecycle-events)
- [Stream Controls](#stream-controls)
- [AFK (Idle) Timeout Handling](#afk-idle-timeout-handling)
- [Stats / Info Panel](#stats--info-panel)
- [Queue System](#queue-system)
- [Voice & Text Chat (AppEx)](#voice--text-chat-appex)
- [Sending Commands to Unreal Engine](#sending-commands-to-unreal-engine)
- [Receiving Responses from Unreal Engine](#receiving-responses-from-unreal-engine)
- [Audio Architecture](#audio-architecture)
- [Customization Guide](#customization-guide)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd Streampixel-SDK-Example

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

Open your browser and navigate to:

```
http://localhost:3000/<YOUR_PROJECT_ID>
```

Replace `<YOUR_PROJECT_ID>` with your StreamPixel project ID (from the dashboard).

---

## Project Structure

```
src/
├── index.js                  # React entry point — renders <App />
├── index.css                 # Global styles (loading screen, controls, stats, AFK overlay)
├── components/
│   ├── App.js                # ✅ SIMPLE EXAMPLE — minimal setup, custom UI, all features
│   ├── VoiceChatUI.js        # Voice + text chat component (used by AppEx)
│   └── VoiceChatUI.css       # Chat styles with dark/light mode support
└── AppEx.js                  # EXTENDED EXAMPLE — includes voice/text chat, audio groups
```

**Which file should I look at?**

- **`App.js`** — Start here. This is the simple, clean example with all the key features: loading screen, mute, fullscreen, stats, AFK handling. It reads the project ID from the URL path.
- **`AppEx.js`** — Extended version that adds voice chat, text chat, audio groups, and avatar generation. Uses a hardcoded project ID (for demonstration).

To switch between them, change the import in `src/index.js`:

```js
// Simple example (default):
import App from './components/App';

// Extended example with voice/text chat:
// import App from './AppEx';
```

---

## How It Works

The StreamPixel Web SDK connects your browser to a remote Unreal Engine instance via **WebRTC**. The flow is:

1. **`StreamPixelApplication(config)`** — Initializes the SDK with your project ID and options
2. **Signaling** — The SDK connects to the signaling server and negotiates a WebRTC peer connection
3. **Stream** — Video and audio from the UE instance are sent to your browser in real-time
4. **Input** — Mouse, keyboard, touch, and gamepad inputs are sent back to UE
5. **Commands** — You can send/receive custom JSON messages between your web app and UE

```
Browser ←──WebRTC──→ StreamPixel Server ←──→ Unreal Engine Instance
         (video/audio/input/data)
```

---

## Project ID & URL Routing

### Option A: Project ID from URL (recommended for production)

`App.js` reads the project ID from the URL path. This lets one deployment serve multiple projects:

```
https://yourdomain.com/690edd608cb8eea6c9c64dc2
https://yourdomain.com/690edd608cb8eea6c9c64dc2?sfuPlayer=true&streamerId=abc123
```

The code extracts it like this:

```js
// The last segment of the URL path is the project ID
const urlPart = window.location.href.split('/').pop();
const baseId = urlPart.split('?')[0]; // Strip query params
setProjectId(baseId);
```

### Option B: Hardcoded Project ID (for demos / single-project deploys)

In `AppEx.js`, the project ID is hardcoded directly in the SDK call:

```js
const { appStream, pixelStreaming } = await StreamPixelApplication({
  appId: "690edd608cb8eea6c9c64dc2",  // ← Your project ID here
  // ...
});
```

### URL Query Parameters

Both examples support these query parameters:

| Parameter    | Type   | Default   | Description |
|-------------|--------|-----------|-------------|
| `streamerId` | String | undefined | Connect to a specific streamer instance |
| `sfuHost`    | String | `"false"` | Enable SFU host mode (see [SFU section](#sfu-selective-forwarding-unit)) |
| `sfuPlayer`  | String | `"false"` | Enable SFU player/viewer mode |

Example: `http://localhost:3000/YOUR_ID?sfuPlayer=true&streamerId=myStreamer`

---

## SDK Configuration Options

### Understanding `appId`

The **`appId`** is the only required parameter. It's your project ID from the StreamPixel dashboard. When the SDK receives an `appId`, it uses it to look up all server-side configuration:

- **Signaling server URL** — Where to negotiate the WebRTC connection
- **TURN server credentials** — For NAT traversal / relaying media
- **UE instance pool** — Which Unreal Engine instances to connect to
- **Session auth / tokens** — Handled automatically by the SDK
- **Matchmaker routing** — How users are assigned to instances

You **don't need to configure** signaling URLs, TURN servers, ICE configs, or auth tokens on the client — all of that is managed through the dashboard and resolved automatically from the `appId`. The remaining parameters below are optional client-side overrides for video, input, and behavior settings.

### Full Configuration Reference

```js
const { appStream, pixelStreaming, queueHandler, UIControl } = await StreamPixelApplication({

  // ── Required ──────────────────────────────────────────────
  appId: "your_project_id",       // Project ID from StreamPixel dashboard

  // ── Connection ────────────────────────────────────────────
  AutoConnect: true,              // Auto-connect on init (default: true)
  streamerId: "abcdef1234",       // Target a specific streamer instance
  sfuHost: "false",               // SFU host mode — "true" | "false"
  sfuPlayer: "false",             // SFU viewer mode — "true" | "false"
  forceTurn: true,                // Force TURN relay (helps with strict firewalls)
  // region: "Asia-pacific",      // Auto-detected from appId; no need to set manually

  // ── Video Playback ────────────────────────────────────────
  AutoPlayVideo: true,            // Auto-play video on load
  StartVideoMuted: true,          // Start with video audio muted

  // ── Codec ─────────────────────────────────────────────────
  primaryCodec: "AV1",            // Preferred codec: 'AV1' | 'H264' | 'VP9' | 'VP8'
  fallBackCodec: "H264",          // Fallback if primary not supported by browser

  // ── Resolution ────────────────────────────────────────────
  maxStreamQuality: '720p (1280x720)',  // Max resolution cap
  // Available: "360p (640x360)", "480p (854x480)", "720p (1280x720)",
  //            "1080p (1920x1080)", "1440p (2560x1440)", "4K (3840x2160)"
  startResolution: "720p (1280x720)",       // Desktop starting resolution
  startResolutionMobile: "480p (854x480)",  // Mobile starting resolution
  startResolutionTab: "1080p (1920x1080)",  // Tablet starting resolution
  resolutionMode: "Fixed Resolution Mode",
  // Options: "Fixed Resolution Mode" | "Crop on Resize Mode" | "Dynamic Resolution Mode"
  resX: 1920,                     // Custom resolution width (pixels)
  resY: 1080,                     // Custom resolution height (pixels)
  resolution: true,               // Enable resolution control

  // ── Bitrate / Quality ─────────────────────────────────────
  minBitrate: 1,                  // Minimum bitrate (Mbps)
  maxBitrate: 100,                // Maximum bitrate (Mbps)
  minQP: 20,                     // Min quantization param (1-51, lower = better quality)
  maxQP: -1,                     // Max quantization param (-1 = no limit)

  // ── Input ─────────────────────────────────────────────────
  mouseInput: true,               // Enable mouse input
  touchInput: true,               // Enable touch input
  keyBoardInput: true,            // Enable keyboard input
  gamepadInput: false,            // Enable gamepad/controller input
  hoverMouse: true,               // Send mouse hover/move events to UE
  fakeMouseWithTouches: false,    // Convert touch events to mouse events
  xrInput: false,                 // Enable WebXR (VR/AR) input

  // ── Audio ─────────────────────────────────────────────────
  useMic: true,                   // Enable microphone input (sent to UE)

  // ── AFK / Timeout ─────────────────────────────────────────
  afktimeout: 120,                // Idle timeout in seconds (min: 1, max: 7200)
});
```

### Return Values

The SDK returns four objects:

| Object            | Description |
|-------------------|-------------|
| `appStream`       | Application wrapper — DOM root, video lifecycle callbacks, stats panel |
| `pixelStreaming`  | Core SDK — event listeners, input control, codec/bitrate settings, connect/disconnect |
| `queueHandler`    | Callback to receive queue position updates |
| `UIControl`       | UI helpers — toggle audio, change resolution, toggle mouse hover, get stats |

---

## SFU (Selective Forwarding Unit)

SFU mode enables **one-to-many streaming** — a single Unreal Engine instance can be viewed by multiple users simultaneously.

### How SFU Works

```
                    ┌──── Viewer 1 (sfuPlayer=true)
UE Instance ───→ SFU Server ──── Viewer 2 (sfuPlayer=true)
(sfuHost=true)      └──── Viewer 3 (sfuPlayer=true)
```

Without SFU (default), each user gets their own dedicated UE instance with full input control. With SFU, one user hosts and others watch the same stream.

### SFU Roles

| Role | URL Param | Description |
|------|-----------|-------------|
| **Host** | `?sfuHost=true` | The user whose UE instance is being shared. Has full input control. Only one host per session. |
| **Player/Viewer** | `?sfuPlayer=true` | Watches the host's stream. Can see but typically cannot control. Multiple viewers allowed. |
| **Default** | (no params) | Standard 1:1 mode. Each user gets their own UE instance. |

### When to Use SFU

- **Presentations / demos** — One person controls, audience watches
- **Live events** — Stream a virtual experience to many viewers
- **Spectator mode** — Let others watch a player's session
- **Cost optimization** — Share one UE instance across many viewers

### SFU Usage

```js
// Host (the one controlling UE):
StreamPixelApplication({ appId: "...", sfuHost: "true" });

// Viewers (watching the host):
StreamPixelApplication({ appId: "...", sfuPlayer: "true" });
```

Or via URL parameters:
```
Host:    https://yourdomain.com/PROJECT_ID?sfuHost=true
Viewer:  https://yourdomain.com/PROJECT_ID?sfuPlayer=true
```

Use `streamerId` to connect viewers to a specific host:
```
https://yourdomain.com/PROJECT_ID?sfuPlayer=true&streamerId=hostInstance123
```

---

## Custom Loading Screen

The loading screen is fully customizable via the `LOADING_CONFIG` object at the top of `App.js` / `AppEx.js`:

```js
const LOADING_CONFIG = {
  backgroundColor: '#18181A',        // Background color
  accentColor: '#4e9cff',            // Spinner, progress bar, button color
  logoUrl: null,                     // Your logo (e.g. '/Images/logo.png')
  title: 'Connecting to Stream',     // Title during connection
  subtitle: 'Please wait...',        // Subtitle during connection
  disconnectedSubtitle: 'The stream session has ended.',  // On disconnect
  showSpinner: true,                 // Show/hide the spinner
  queueMessage: (pos) => `You are in queue at position ${pos}`,

  // Each status message maps to a WebRTC lifecycle event:
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
  },
};
```

The loading screen automatically:
- Shows a **progress bar** that advances with each WebRTC event
- Shows the **queue position** when waiting
- Changes title/subtitle to **"Disconnected"** or **"Connection Failed"** on error (not "Connecting to Stream")
- Hides spinner and progress bar on disconnect/failure states

### Adding Custom Elements to the Loading Screen

Inside the loading screen JSX, there's a marked section for custom elements:

```jsx
{/* CUSTOM ELEMENTS: Add your own buttons, messages, or components here */}
<div className="loading-actions">
  <button className="loading-btn" onClick={() => alert('Hello!')}>
    Custom Button
  </button>
</div>
```

---

## WebRTC Lifecycle Events

The SDK fires events as the WebRTC connection progresses. These are used to drive the loading screen progress, but you can also listen to them for your own logic:

```js
pixelStreaming.addEventListener('webRtcAutoConnect', () => { /* Auto-connect started */ });
pixelStreaming.addEventListener('webRtcConnecting',  () => { /* Peer connection opening */ });
pixelStreaming.addEventListener('webRtcSdp',         () => { /* SDP offer/answer exchanged */ });
pixelStreaming.addEventListener('webRtcConnected',   () => { /* Peer connection established */ });
pixelStreaming.addEventListener('streamLoading',     () => { /* Stream data arriving */ });
pixelStreaming.addEventListener('playStream',        () => { /* Video about to play */ });
pixelStreaming.addEventListener('videoInitialized',  () => { /* Video element ready — stream is live */ });
pixelStreaming.addEventListener('webRtcFailed',      () => { /* Connection failed */ });
pixelStreaming.addEventListener('webRtcDisconnected', () => { /* Connection lost */ });
```

**Connection flow:**

```
webRtcAutoConnect → webRtcConnecting → webRtcSdp → webRtcConnected → streamLoading → playStream → videoInitialized
                                                                                                      ↓
                                                                                            Stream is live! ✓
```

---

## Stream Controls

Three built-in controls appear as circular buttons in the bottom-right corner:

### Mute / Unmute

**Muted by default.** The SDK uses a separate `<audio>` element for stream audio (not the `<video>` element's audio track). The mute toggle targets both:

```js
// Video element audio
videoElement.muted = newMuted;

// SDK's separate audio element
const audioEl = appStream.stream._webRtcController.streamController.audioElement;
audioEl.muted = newMuted;
if (!newMuted && audioEl.paused) audioEl.play(); // Handle autoplay policy
```

### Fullscreen

Toggles browser fullscreen mode. Listens to `fullscreenchange` event to stay in sync (e.g., when user presses Escape).

### Stats / Info Panel

Opens a popup showing the same stats as the default Pixel Streaming stats panel:

- Video/Audio Bitrate (kbps)
- Video Resolution
- Framerate (FPS)
- Frames Decoded / Dropped
- Packets Lost
- Video Codec (e.g., AV1, H264, VP9)
- Audio Codec (e.g., opus)
- Net RTT (ms)
- Decode Time / Jitter Buffer

Stats are received via the `statsReceived` event. Codec names are resolved from the SDK's internal `codecs` Map (e.g., `codecId → mimeType → "video/AV1" → "AV1"`).

---

## AFK (Idle) Timeout Handling

When the user is idle for too long, the SDK triggers an AFK warning. Instead of the default black screen overlay, this example shows a **custom card UI** with:

- "Are you still there?" message
- Live countdown timer
- "I'm still here" button to dismiss
- Clicking anywhere on the overlay also dismisses

The AFK events:

```js
pixelStreaming.addEventListener('afkWarningActivate', (e) => {
  // e.data.countDown — seconds remaining
  // e.data.dismissAfk — callback to reset the timer
});

pixelStreaming.addEventListener('afkWarningUpdate', (e) => {
  // e.data.countDown — updated seconds remaining (fires every second)
});

pixelStreaming.addEventListener('afkWarningDeactivate', () => {
  // Warning dismissed, back to normal
});

pixelStreaming.addEventListener('afkTimedOut', () => {
  // User didn't respond — session disconnected
});
```

Configure the timeout duration in the SDK config:

```js
StreamPixelApplication({
  afktimeout: 120, // seconds (min: 1, max: 7200)
});
```

The default SDK AFK overlay is hidden via CSS: `#afkOverlay { display: none !important; }`

---

## Stats / Info Panel

Stream statistics come from the `statsReceived` event, which fires periodically with an `AggregatedStats` object. The stats contain nested sub-objects:

```js
aggregatedStats = {
  inboundVideoStats: { bitrate, frameWidth, frameHeight, framesPerSecond, codecId, ... },
  inboundAudioStats: { bitrate, codecId, ... },
  sessionStats:      { currentRoundTripTime, duration, ... },
  streamStats:       { bytesReceived, ... },
  codecs:            Map<codecId, { mimeType, ... }>,  // e.g. "video/AV1"
}
```

The `extractPSStats()` helper function extracts the same fields shown in the default Pixel Streaming stats panel. Codec names are resolved from the `codecs` Map (e.g., `codecId → stats.codecs.get(codecId).mimeType → "video/AV1" → "AV1"`).

> **Note:** `UIControl.getStreamStats()` returns `void` — it only triggers stats collection. Always use the `statsReceived` event to receive actual data.

---

## Queue System

When all UE instances are busy, users are placed in a queue. The `queueHandler` callback fires with position updates:

```js
queueHandler((msg) => {
  console.log("Position:", msg.position); // 1, 2, 3, ...
});
```

The loading screen shows the queue position automatically with a badge.

---

## Voice & Text Chat (AppEx)

`AppEx.js` demonstrates the `VoiceChatUI` component for real-time voice and text chat:

```jsx
<VoiceChatUI
  roomName="TESTSDKROOM"    // Chat room identifier
  userName={userName}        // Generated random username
  voiceChat={true}          // Enable voice chat
  textChat={true}           // Enable text chat
  darkMode={false}          // Dark/light theme
  micStart={true}           // Start with mic on
  position="Left"           // Panel position: "Left" | "Right"
  avatar={avatar}           // DiceBear avatar SVG string
  showAudioGroup={false}    // Show audio group modal
/>
```

---

## Sending Commands to Unreal Engine

Send custom JSON messages to your UE application:

```js
// Send a UI interaction (custom game events)
appStream.stream.emitUIInteraction({
  message: { type: "setResolution", value: "1080p (1920x1080)" }
});

// Send a console command to UE
pixelStreaming.emitConsoleCommand("stat fps");

// Send text input
pixelStreaming.sendTextboxEntry("Hello from the web!");
```

---

## Receiving Responses from Unreal Engine

Listen for custom messages sent from your UE application:

```js
pixelStreaming.addResponseEventListener('handle_responses', (response) => {
  const data = JSON.parse(response);
  console.log("UE says:", data);
  // Handle your custom UE → Web messages here
});
```

---

## Audio Architecture

The SDK creates **two separate media elements** for audio:

1. **`<video>` element** — Renders the video stream. May also carry an audio track.
2. **`<audio>` element** — A separate element created by the SDK at `appStream.stream._webRtcController.streamController.audioElement`. This handles the primary audio stream.

**Why this matters:** Toggling `video.muted` alone won't mute the stream. You must also mute the `<audio>` element. See the `toggleMute` function in `App.js` for the correct implementation.

**Microphone input** (sending your mic audio to UE):

```js
await navigator.mediaDevices.getUserMedia({ audio: true });
pixelStreaming.unmuteMicrophone(true);
```

---

## Customization Guide

### Hiding the Default Pixel Streaming UI

The SDK ships with a built-in overlay (settings, stats, fullscreen buttons in the top-left). This example hides it so you can use your own UI:

```css
/* CSS safety net — always hides it */
#uiFeatures { display: none !important; }
#afkOverlay { display: none !important; }
```

Plus JS-based hiding after SDK init and after DOM mount (in case timing varies):

```js
const uiEl = appStream.rootElement?.querySelector('#uiFeatures');
if (uiEl) uiEl.style.display = 'none';
```

### Styling

All styles are in `src/index.css` with clear section headers:

- **Loading Screen** — `.loading-overlay`, `.loading-spinner`, `.loading-title`, `.loading-progress-*`
- **Stream Controls** — `.stream-controls`, `.control-btn`, `.control-btn-active`
- **Stats Popup** — `.stats-popup`, `.stats-row`, `.stats-label`, `.stats-value`
- **AFK Overlay** — `.afk-overlay`, `.afk-card`, `.afk-countdown`, `.afk-btn`

### Adding Custom Buttons

Add buttons inside the `stream-controls` div:

```jsx
<div className="stream-controls">
  {/* ... existing buttons ... */}
  <button className="control-btn" onClick={myHandler} title="My Button">
    <svg>...</svg>
  </button>
</div>
```

### Using UIControl Methods

```js
UIControl.toggleAudio();                    // Toggle stream audio
UIControl.handleResMax('1280x720');         // Change max resolution
UIControl.toggleHoveringMouse(true);        // Enable/disable mouse hover events
UIControl.getStreamStats();                 // Trigger stats collection (listen via event)
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Black screen, no video | Project ID incorrect or UE not running | Check `appId` and StreamPixel dashboard |
| Audio not working | Separate `<audio>` element not unmuted | Use the `toggleMute` pattern (mute both video + audio elements) |
| Stats show `[object Object]` | Raw AggregatedStats has nested objects | Use `extractPSStats()` to flatten them |
| Default PS UI showing | `#uiFeatures` not hidden | Ensure CSS rule `#uiFeatures { display: none !important; }` exists |
| "Connecting..." on disconnect | Title/subtitle not updated for disconnect state | Use separate `loadingTitle` / `loadingSubtitle` state |
| Codec shows raw ID | Using `codecId` directly instead of resolving | Look up `stats.codecs.get(codecId).mimeType` |
| AFK black screen | Default AFK overlay visible | Add `#afkOverlay { display: none !important; }` and handle AFK events |
| Connection fails behind firewall | WebRTC peer-to-peer blocked | Set `forceTurn: true` in SDK config |

---

## License

This example is provided for integration reference. The StreamPixel Web SDK is proprietary — see your StreamPixel license agreement for terms.
