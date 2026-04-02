import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StreamPixelApplication } from 'streampixelsdk';

let PixelStreamingApp;
let PixelStreamingUiApp;
let UIControlApp;

/* =========================================================================
   FEATURE TOGGLES
   =========================================================================
   Set SHOW_DEV_TOOLS to true to display the Developer Tools panel
   (console commands, textbox entry, connect/disconnect/reconnect,
   resolution control, microphone, hovering mouse).
   Set to false to hide it entirely in production.
   ========================================================================= */
const SHOW_DEV_TOOLS = true;


/* =========================================================================
   CUSTOMIZATION: Loading Screen Configuration
   =========================================================================
   Modify these values to customize the loading screen that appears
   while the stream is connecting.
   ========================================================================= */

const LOADING_CONFIG = {
  // Loading screen background color
  backgroundColor: '#18181A',

  // Primary accent color (used for spinner, progress bar, buttons)
  accentColor: '#4e9cff',

  // Your logo URL (set to null to hide the logo)
  logoUrl: null, // e.g. '/Images/logoNew.png'

  // Loading title text
  title: 'Connecting to Stream',

  // Loading subtitle / description text
  // Subtitle shown during connection (hidden on disconnect/failure)
  subtitle: 'Please wait while we set up your experience...',

  // Subtitle shown on disconnect / failure states
  disconnectedSubtitle: 'The stream session has ended.',

  // Text shown when the user is placed in a queue
  queueMessage: (position) => `You are in queue at position ${position}`,

  // Show a spinner animation
  showSpinner: true,

  // Status messages mapped to WebRTC lifecycle events
  // Customize these to change what users see at each connection stage
  statusMessages: {
    initializing:    'Initializing...',
    connecting:      'Connecting to server...',
    webRtcConnecting:'Establishing WebRTC connection...',
    sdpNegotiation:  'Negotiating stream parameters...',
    webRtcConnected: 'WebRTC connected, loading stream...',
    streamLoading:   'Stream is loading...',
    playingStream:   'Starting video playback...',
    inQueue:         'Waiting in queue...',
    failed:          'Connection failed. Please try again.',
    disconnected:    'Disconnected from stream.',

    // Reconnection status messages
    reconnecting:    'Reconnecting to stream...',
    retrying:        'Retrying connection...',
    reconnected:     'Reconnected! Loading stream...',
    reconnectFailed: 'Unable to reconnect. Please refresh the page.',
  },

  // Reconnection screen titles & subtitles
  reconnectingTitle:    'Reconnecting',
  reconnectingSubtitle: 'Please wait while we restore your session...',
  reconnectedTitle:     'Reconnected',
  reconnectFailedTitle: 'Reconnection Failed',
  reconnectFailedSubtitle: 'We were unable to restore your session.',
};


/* =========================================================================
   Helper: Extract Pixel Streaming stats (same fields as the default
   PS stats panel) from the AggregatedStats object.
   ========================================================================= */
function extractPSStats(stats) {
  if (!stats || typeof stats !== 'object') return null;

  const result = {};
  const add = (label, val) => {
    if (val !== undefined && val !== null && val !== '') result[label] = val;
  };

  // Shorthand references to nested stat objects
  const iv = stats.inboundVideoStats || {};
  const ia = stats.inboundAudioStats || {};
  const ss = stats.sessionStats || {};
  const st = stats.streamStats || {};
  const codecs = stats.codecs; // Map<codecId, { mimeType, ... }>

  // Resolve codec name from the codecs Map (same logic as default PS stats panel).
  // The codecId is something like "RTCCodec_0_Inbound_96"; the Map entry has
  // a mimeType like "video/AV1" — we strip the "video/" or "audio/" prefix.
  const resolveCodec = (codecId, prefix) => {
    if (!codecId || !codecs) return undefined;
    const entry = codecs.get ? codecs.get(codecId) : codecs[codecId];
    if (entry && entry.mimeType) return entry.mimeType.replace(prefix, '');
    return undefined;
  };

  // Session stats (same fields as the default Pixel Streaming stats panel)
  add('Video Bitrate (kbps)',  iv.bitrate);
  add('Audio Bitrate (kbps)',  ia.bitrate);
  add('Video Resolution',      iv.frameWidth && iv.frameHeight ? `${iv.frameWidth}x${iv.frameHeight}` : undefined);
  add('Framerate',             iv.framesPerSecond || iv.framerate);
  add('Frames Decoded',        iv.framesDecoded);
  add('Frames Dropped',        iv.framesDropped);
  add('Packets Lost',          iv.packetsLost);
  add('Video Codec',           resolveCodec(iv.codecId, 'video/'));
  add('Audio Codec',           resolveCodec(ia.codecId, 'audio/'));
  add('Net RTT (ms)',          ss.currentRoundTripTime !== undefined ? (ss.currentRoundTripTime * 1000) : undefined);
  add('Received (bytes)',      st.bytesReceived || iv.bytesReceived);
  add('Duration',              ss.duration);
  add('Video QP',              iv.qpSum);

  // Latency stats
  add('Decode Time (ms)',      iv.totalDecodeTime !== undefined && iv.framesDecoded ? ((iv.totalDecodeTime / iv.framesDecoded) * 1000) : undefined);
  add('Jitter Buffer (ms)',    iv.jitterBufferDelay !== undefined && iv.jitterBufferEmittedCount ? ((iv.jitterBufferDelay / iv.jitterBufferEmittedCount) * 1000) : undefined);

  return Object.keys(result).length > 0 ? result : null;
}


const App = () => {
  const [projectId, setProjectId] = useState();
  const [sfuHost, setSfuHost] = useState("False");
  const [sfuPlayer, setSfuPlayer] = useState("False");
  const [streamerId, setStreamerId] = useState();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTitle, setLoadingTitle] = useState(LOADING_CONFIG.title);
  const [loadingSubtitle, setLoadingSubtitle] = useState(LOADING_CONFIG.subtitle);
  const [queuePosition, setQueuePosition] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(LOADING_CONFIG.statusMessages.initializing);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [reconnecting, setReconnecting] = useState(true);

  // Controls state
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState(null);

  // AFK state
  const [afkWarning, setAfkWarning] = useState(false);
  const [afkCountdown, setAfkCountdown] = useState(0);
  const dismissAfkRef = useRef(null);

  // Developer Tools state
  const [showDevTools, setShowDevTools] = useState(false);
  const [consoleCmd, setConsoleCmd] = useState('stat fps');
  const [textboxText, setTextboxText] = useState('');
  const [uiInteractionJson, setUiInteractionJson] = useState('{"type":"setColor","value":"red"}');

  const videoRef = useRef(null);

  const urlPart = window.location.href.split('/').pop();

  useEffect(() => {
    if (urlPart) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const baseId = urlPart.split('?')[0];
      setProjectId(baseId);

      for (const [key, value] of urlSearchParams.entries()) {
        if (key === 'streamerId') setStreamerId(value);
        if (key === 'sfuHost') setSfuHost(value);
        if (key === 'sfuPlayer') setSfuPlayer(value);
      }
    }
  }, [urlPart]);


  const startPlay = async () => {
    setLoadingStatus(LOADING_CONFIG.statusMessages.connecting);
    setLoadingProgress(10);

    /* =====================================================================
       StreamPixelApplication() — Initialize the SDK.

       The `appId` is your project ID from the StreamPixel dashboard.
       It tells the SDK which signaling server, TURN credentials, and
       UE instance pool to use. All server-side config (URLs, auth,
       instance allocation) is managed by the dashboard — you only
       need the appId on the client side.

       Everything else below is optional client-side overrides.
       ===================================================================== */
    const { appStream, pixelStreaming, queueHandler,UIControl,reconnectStream } = await StreamPixelApplication({

      
      // ── Required ──────────────────────────────────────────────────────
      appId: projectId,              // Project ID (from URL or hardcoded)

      // ── Connection ────────────────────────────────────────────────────
      AutoConnect: true,             // Connect immediately on init
      streamerId: streamerId,        // Target a specific streamer instance (optional)
      sfuHost: sfuHost,              // SFU host mode: "true" | "false" (default: "false")
      sfuPlayer: sfuPlayer,          // SFU viewer mode: "true" | "false" (default: "false")
      forceTurn: true,               // Force TURN relay (helps behind strict firewalls)
      // region: "Asia-pacific",     // Auto-detected from appId; no need to set manually

      // ── Video Playback ────────────────────────────────────────────────
      // AutoPlayVideo: true,        // Auto-play video on load
      // StartVideoMuted: true,      // Start with video audio muted

      // ── Codec ─────────────────────────────────────────────────────────
      // primaryCodec: "AV1",        // Preferred codec: 'AV1' | 'H264' | 'VP9' | 'VP8'
      // fallBackCodec: "H264",      // Fallback if primary not supported by browser

      // ── Resolution ────────────────────────────────────────────────────
      // maxStreamQuality: '720p (1280x720)',
      //   Options: "360p (640x360)" | "480p (854x480)" | "720p (1280x720)"
      //          | "1080p (1920x1080)" | "1440p (2560x1440)" | "4K (3840x2160)"
      // startResolution: "720p (1280x720)",        // Desktop initial resolution
      // startResolutionMobile: "480p (854x480)",   // Mobile initial resolution
      // startResolutionTab: "1080p (1920x1080)",   // Tablet initial resolution
      // resolutionMode: "Fixed Resolution Mode",
      //   Options: "Fixed Resolution Mode" | "Crop on Resize Mode" | "Dynamic Resolution Mode"
      // resX: 1920,                 // Custom resolution width (pixels)
      // resY: 1080,                 // Custom resolution height (pixels)
      // resolution: true,           // Enable resolution control

      // ── Bitrate / Quality ─────────────────────────────────────────────
      // minBitrate: 1,              // Minimum bitrate (Mbps)
      // maxBitrate: 100,            // Maximum bitrate (Mbps)
      // minQP: 20,                  // Min quantization param (1-51, lower = better quality)
      // maxQP: -1,                  // Max quantization param (-1 = no limit)

      // ── Input ─────────────────────────────────────────────────────────
      mouseInput: true,              // Enable mouse input
      keyBoardInput: true,           // Enable keyboard input
      touchInput: true,              // Enable touch input
      hoverMouse: true,              // Send mouse hover/move events to UE
      // gamepadInput: true,         // Uncomment to enable gamepad/controller input
      // xrInput: true,              // Uncomment to enable WebXR (VR/AR) input
      // fakeMouseWithTouches: false, // Convert touch events to mouse events

      // ── Audio ─────────────────────────────────────────────────────────
      // useMic: true,               // Enable microphone input (sent to UE)

      // ── AFK / Timeout ─────────────────────────────────────────────────
      // afktimeout: 120,            // Idle timeout in seconds (min: 1, max: 7200)
    });


    

    PixelStreamingApp = pixelStreaming;
    PixelStreamingUiApp = appStream;
    UIControlApp = UIControl;
   


    console.log("UIControlApp:",UIControlApp);
    
    /* =====================================================================
       Reconnection Lifecycle → Loading Screen Updates
       ===================================================================== */
    reconnectStream.on("state", (data) => {


      
      switch (data.status) {
        case "connecting":
        case "reconnecting":
          // Show loading overlay with reconnecting state
          setIsLoading(true);
          setIsMuted(true);
          setLoadingTitle(LOADING_CONFIG.reconnectingTitle);
          setLoadingSubtitle(LOADING_CONFIG.reconnectingSubtitle);
          setLoadingStatus(LOADING_CONFIG.statusMessages.reconnecting);
          setLoadingProgress(20);
          setReconnecting(true);
          break;
/*
        case "retrying":
          // Update status to show retry in progress
          setLoadingStatus(LOADING_CONFIG.statusMessages.retrying);
          setLoadingProgress(40);
          
          break;
*/
        case "connected":
          // Reconnected — stream events (playStream, onVideoInitialized)
          // will dismiss the loading overlay once the video is ready.
          setLoadingTitle(LOADING_CONFIG.reconnectedTitle);
          setLoadingSubtitle(LOADING_CONFIG.subtitle);
          setLoadingStatus(LOADING_CONFIG.statusMessages.reconnected);
          setLoadingProgress(70);
          break;

        case "disconnected":
          // Show disconnected state in loading overlay
          setIsLoading(true);
          if(!reconnecting){
          setLoadingTitle('Disconnected');
          setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
          setLoadingStatus(LOADING_CONFIG.statusMessages.disconnected);
          setLoadingProgress(0);
          }
          break;

        case "failed":
          // Reconnection exhausted — show failure state
          setIsLoading(true);
          setLoadingTitle(LOADING_CONFIG.reconnectFailedTitle);
          setLoadingSubtitle(LOADING_CONFIG.reconnectFailedSubtitle);
          setLoadingStatus(LOADING_CONFIG.statusMessages.reconnectFailed);
          setLoadingProgress(0);
          break;
      }
    });

    /* =====================================================================
       Hide the default Pixel Streaming UI overlay (top-left controls).
       ===================================================================== */
    const uiFeaturesEl = appStream.uiFeaturesElement
      || appStream.rootElement?.querySelector('#uiFeatures');
    if (uiFeaturesEl) {
      uiFeaturesEl.style.display = 'none';
    }

    /* =====================================================================
       WebRTC Lifecycle Events → Loading Progress
       ===================================================================== */

    pixelStreaming.addEventListener('webRtcAutoConnect', () => {
      setLoadingStatus(LOADING_CONFIG.statusMessages.connecting);
      setLoadingProgress(15);
    });

    pixelStreaming.addEventListener('webRtcConnecting', () => {
      setLoadingStatus(LOADING_CONFIG.statusMessages.webRtcConnecting);
      setLoadingProgress(30);
    });

    pixelStreaming.addEventListener('webRtcSdp', () => {
      setLoadingStatus(LOADING_CONFIG.statusMessages.sdpNegotiation);
      setLoadingProgress(50);
    });

    pixelStreaming.addEventListener('webRtcConnected', () => {
      setLoadingStatus(LOADING_CONFIG.statusMessages.webRtcConnected);
      setLoadingProgress(70);
    });

    pixelStreaming.addEventListener('streamLoading', () => {
      setLoadingStatus(LOADING_CONFIG.statusMessages.streamLoading);
      setLoadingProgress(80);
    });

    pixelStreaming.addEventListener('playStream', () => {
      setLoadingStatus(LOADING_CONFIG.statusMessages.playingStream);
      setLoadingProgress(90);
    });

    pixelStreaming.addEventListener('webRtcFailed', () => {
      setLoadingTitle('Connection Failed');
      setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
      setLoadingStatus(LOADING_CONFIG.statusMessages.failed);
      setLoadingProgress(0);
    });

    pixelStreaming.addEventListener('webRtcDisconnected', () => {

      if(!reconnecting){
      setLoadingTitle('Disconnected');
      setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
      setLoadingStatus(LOADING_CONFIG.statusMessages.disconnected);
      setIsLoading(true);
      setLoadingProgress(0);
      }
    });

    /* =====================================================================
       Stats: Extract same fields the default Pixel Streaming panel shows.
       ===================================================================== */
    pixelStreaming.addEventListener('statsReceived', (e) => {
      if (e.data && e.data.aggregatedStats) {
        const ps = extractPSStats(e.data.aggregatedStats);
        if (ps) setStatsData(ps);
      }
    });

    /* =====================================================================
       AFK Warning: Custom overlay instead of the default black screen.
       ===================================================================== */
    pixelStreaming.addEventListener('afkWarningActivate', (e) => {
      setAfkWarning(true);
      setAfkCountdown(e.data.countDown);
      dismissAfkRef.current = e.data.dismissAfk;
    });

    pixelStreaming.addEventListener('afkWarningUpdate', (e) => {
      setAfkCountdown(e.data.countDown);
    });

    pixelStreaming.addEventListener('afkWarningDeactivate', () => {
      setAfkWarning(false);
      dismissAfkRef.current = null;
    });

    pixelStreaming.addEventListener('afkTimedOut', () => {
      setAfkWarning(false);
      dismissAfkRef.current = null;
      setLoadingTitle('Session Ended');
      setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
      setLoadingStatus('You were disconnected due to inactivity.');
      setIsLoading(true);
      setLoadingProgress(0);
    });

    appStream.onVideoInitialized = () => {
      videoRef.current.append(appStream.rootElement);

      // Hide default UI after DOM is mounted
      const uiEl = appStream.rootElement?.querySelector('#uiFeatures');
      if (uiEl) uiEl.style.display = 'none';

      const videoElement = appStream.stream.videoElementParent.querySelector("video");
      if (videoElement) {
        videoElement.muted = true;
        videoElement.focus();
        videoElement.autoplay = true;
        videoElement.tabIndex = 0;
      }

      // Mute the separate audio element the SDK creates
      try {
        const audioEl = appStream.stream._webRtcController.streamController.audioElement;
        if (audioEl) audioEl.muted = true;
      } catch (_) {}

      // Hide loading screen
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setQueuePosition(null);
        setLoadingTitle(LOADING_CONFIG.title);
        setLoadingSubtitle(LOADING_CONFIG.subtitle);
      }, 300);
    };

    appStream.onDisconnect = function () {
      console.log("Disconnected");
    };

    queueHandler((msg) => {
      console.log("User is in queue at position:", msg.position);
      setQueuePosition(msg.position);
      setLoadingStatus(LOADING_CONFIG.statusMessages.inQueue);
    });

    PixelStreamingApp.addResponseEventListener('handle_responses', handleResponseApp);
  };

  useEffect(() => {
    if (projectId) {
      startPlay();
    }
  }, [projectId]);




  const handleResponseApp = (response) => {
    console.log(response);
  };


  // ── AFK dismiss ────────────────────────────────────────────────────────
  const handleDismissAfk = useCallback(() => {
    if (dismissAfkRef.current) {
      dismissAfkRef.current();
    }
  }, []);


  // ── Mute / Unmute ──────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;

    const videoElement = PixelStreamingUiApp?.stream?.videoElementParent?.querySelector("video");
    if (videoElement) {
      videoElement.muted = newMuted;
    }

    try {
      const audioEl = PixelStreamingUiApp.stream._webRtcController.streamController.audioElement;
      if (audioEl) {
        audioEl.muted = newMuted;
        if (!newMuted && audioEl.paused) {
          audioEl.play().catch(() => {});
        }
      }
    } catch (_) {}

    setIsMuted(newMuted);
  }, [isMuted]);


  // ── Fullscreen ─────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);


  // ── Stats popup ────────────────────────────────────────────────────────
  const toggleStats = useCallback(() => {
    setShowStats((prev) => !prev);
  }, []);


  // ── Developer Tools handlers ──────────────────────────────────────────

  // Send a console command to UE (e.g., "stat fps", "stat unit", "r.SetRes 1920x1080f")
  const handleConsoleCommand = useCallback((cmd) => {
    if (PixelStreamingApp) {
      PixelStreamingApp.emitConsoleCommand(cmd);
    }
  }, []);

  // Send text as if typed into a focused UE text input field
  const handleTextboxEntry = useCallback((text) => {
    if (PixelStreamingApp) {
      PixelStreamingApp.sendTextboxEntry(text);
    }
  }, []);

  // Send a custom JSON payload to UE via UI Interaction
  const handleSendToUE = useCallback((jsonStr) => {
    if (PixelStreamingUiApp) {
      try {
        const descriptor = JSON.parse(jsonStr);
        PixelStreamingUiApp.stream.emitUIInteraction(descriptor);
      } catch (e) {
        console.error('Invalid JSON:', e);
      }
    }
  }, []);

  // Manually disconnect the stream
  const handleDisconnect = useCallback(() => {
    if (PixelStreamingApp) {
      PixelStreamingApp.disconnect();
    }
  }, []);

  // Manually connect (when AutoConnect is false or after a disconnect)
  const handleManualConnect = useCallback(() => {
    if (PixelStreamingApp) {
      PixelStreamingApp.connect();
    }
  }, []);

  // Manually trigger a reconnection
  const handleReconnect = useCallback(() => {
    if (PixelStreamingApp) {
      PixelStreamingApp.reconnect();
    }
  }, []);

  // Enable microphone input (sends mic audio to UE)
  const handleMicrophone = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      PixelStreamingApp.unmuteMicrophone(true);
    } catch (err) {
      console.error('Microphone access denied', err);
    }
  }, []);


  const renderStatValue = (label, value) => {
    if (value === undefined || value === null) return null;
    const displayValue = typeof value === 'number'
      ? (Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2))
      : String(value);
    return (
      <div className="stats-row" key={label}>
        <span className="stats-label">{label}</span>
        <span className="stats-value">{displayValue}</span>
      </div>
    );
  };


  return (
    <div className='containMain'>

      {/* ================================================================
          LOADING / DISCONNECTED SCREEN
          ================================================================ */}
      {isLoading && (
        <div className='loading-overlay' style={{ backgroundColor: LOADING_CONFIG.backgroundColor }}>

          {LOADING_CONFIG.logoUrl && (
            <img src={LOADING_CONFIG.logoUrl} alt="Logo" className="loading-logo" />
          )}

          {LOADING_CONFIG.showSpinner && loadingProgress > 0 && (
            <div className="loading-spinner" style={{ borderTopColor: LOADING_CONFIG.accentColor }} />
          )}

          <h2 className="loading-title">{loadingTitle}</h2>
          <p className="loading-subtitle">{loadingSubtitle}</p>

          {loadingProgress > 0 && (
            <div className="loading-progress-track">
              <div
                className="loading-progress-fill"
                style={{
                  width: `${loadingProgress}%`,
                  backgroundColor: LOADING_CONFIG.accentColor,
                }}
              />
            </div>
          )}

          <p className="loading-status">{loadingStatus}</p>

          {queuePosition !== null && (
            <div className="loading-queue">
              <p className="loading-queue-text">
                {LOADING_CONFIG.queueMessage(queuePosition)}
              </p>
              <div className="loading-queue-badge" style={{ backgroundColor: LOADING_CONFIG.accentColor }}>
                #{queuePosition}
              </div>
            </div>
          )}

          {/* ============================================================
              CUSTOM ELEMENTS: Add your own buttons, messages, or
              components inside the loading screen here.
              ============================================================ */}

        </div>
      )}

      {/* Video container */}
      <div
        id="videoElement"
        ref={videoRef}
        style={{
          backgroundSize: "cover",
          height: "100vh",
          position: "relative"
        }}
      />

      {/* ================================================================
          AFK WARNING OVERLAY
          ================================================================
          Customizable overlay shown when the user is idle.
          Replace the text, styling, or add your own branding.
          ================================================================ */}
      {afkWarning && (
        <div className="afk-overlay" onClick={handleDismissAfk}>
          <div className="afk-card">
            <div className="afk-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2 className="afk-title">Are you still there?</h2>
            <p className="afk-subtitle">No activity detected</p>
            <div className="afk-countdown" style={{ color: LOADING_CONFIG.accentColor }}>
              {afkCountdown}s
            </div>
            <p className="afk-hint">Disconnecting due to inactivity</p>
            <button
              className="afk-btn"
              style={{ backgroundColor: LOADING_CONFIG.accentColor }}
              onClick={handleDismissAfk}
            >
              I'm still here
            </button>
          </div>
        </div>
      )}

      {/* ================================================================
          STREAM CONTROLS
          ================================================================ */}
      {!isLoading && (
        <div className="stream-controls">

          {/* Mute / Unmute */}
          <button
            className="control-btn"
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* Fullscreen */}
          <button
            className="control-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>

          {/* Info / Stats */}
          <button
            className={`control-btn ${showStats ? 'control-btn-active' : ''}`}
            onClick={toggleStats}
            title="Stream Info"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>

          {/* Developer Tools (toggle via SHOW_DEV_TOOLS constant) */}
          {SHOW_DEV_TOOLS && (
            <button
              className={`control-btn ${showDevTools ? 'control-btn-active' : ''}`}
              onClick={() => setShowDevTools((prev) => !prev)}
              title="Developer Tools"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </button>
          )}

        </div>
      )}

      {/* ================================================================
          STATS POPUP — same fields as default Pixel Streaming panel
          ================================================================ */}
      {showStats && (
        <div className="stats-popup">
          <div className="stats-popup-header">
            <span className="stats-popup-title">Stream Info</span>
            <button className="stats-popup-close" onClick={() => setShowStats(false)}>&times;</button>
          </div>
          <div className="stats-popup-body">
            {statsData && Object.keys(statsData).length > 0 ? (
              Object.entries(statsData).map(([key, val]) => renderStatValue(key, val))
            ) : (
              <p className="stats-empty">Waiting for stream statistics...</p>
            )}
          </div>
        </div>
      )}

      {/* ================================================================
          DEVELOPER TOOLS PANEL
          ================================================================
          Toggle visibility via the SHOW_DEV_TOOLS constant at the top
          of this file. Set to false to hide in production.
          ================================================================ */}
      {SHOW_DEV_TOOLS && showDevTools && (
        <div className="dev-tools-popup">
          <div className="stats-popup-header">
            <span className="stats-popup-title">Developer Tools</span>
            <button className="stats-popup-close" onClick={() => setShowDevTools(false)}>&times;</button>
          </div>
          <div className="stats-popup-body">

            {/* ── Send to UE ────────────────────────────────── */}
            <div className="dev-tools-section">
              <label className="dev-tools-label">Console Command</label>
              <div className="dev-tools-row">
                <input
                  className="dev-tools-input"
                  type="text"
                  value={consoleCmd}
                  onChange={(e) => setConsoleCmd(e.target.value)}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleConsoleCommand(consoleCmd); }}
                  placeholder="e.g. stat fps"
                />
                <button className="dev-tools-btn" onClick={() => handleConsoleCommand(consoleCmd)}>Send</button>
              </div>
            </div>

            <div className="dev-tools-section">
              <label className="dev-tools-label">Textbox Entry</label>
              <div className="dev-tools-row">
                <input
                  className="dev-tools-input"
                  type="text"
                  value={textboxText}
                  onChange={(e) => setTextboxText(e.target.value)}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleTextboxEntry(textboxText); }}
                  placeholder="Text to send to UE"
                />
                <button className="dev-tools-btn" onClick={() => handleTextboxEntry(textboxText)}>Send</button>
              </div>
            </div>

            <div className="dev-tools-section">
              <label className="dev-tools-label">UI Interaction (JSON)</label>
              <div className="dev-tools-row">
                <input
                  className="dev-tools-input"
                  type="text"
                  value={uiInteractionJson}
                  onChange={(e) => setUiInteractionJson(e.target.value)}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleSendToUE(uiInteractionJson); }}
                  placeholder='{"type":"action","value":"..."}'
                />
                <button className="dev-tools-btn" onClick={() => handleSendToUE(uiInteractionJson)}>Send</button>
              </div>
            </div>

            {/* ── Connection ─────────────────────────────────── */}
            <div className="dev-tools-section">
              <label className="dev-tools-label">Connection</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn" onClick={handleManualConnect}>Connect</button>
                <button className="dev-tools-btn" onClick={handleReconnect}>Reconnect</button>
                <button className="dev-tools-btn dev-tools-btn-danger" onClick={handleDisconnect}>Disconnect</button>
              </div>
            </div>

            {/* ── Audio ──────────────────────────────────────── */}
            <div className="dev-tools-section">
              <label className="dev-tools-label">Audio</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn" onClick={() => UIControlApp && UIControlApp.toggleAudio()}>Toggle Audio</button>
                <button className="dev-tools-btn" onClick={handleMicrophone}>Enable Mic</button>
              </div>
            </div>

            {/* ── Resolution ─────────────────────────────────── */}
            <div className="dev-tools-section">
              <label className="dev-tools-label">Resolution</label>
              <div className="dev-tools-row dev-tools-row-wrap">
                <button className="dev-tools-btn" onClick={() => UIControlApp && UIControlApp.handleResMax('854x480')}>480p</button>
                <button className="dev-tools-btn" onClick={() => UIControlApp && UIControlApp.handleResMax('1280x720')}>720p</button>
                <button className="dev-tools-btn" onClick={() => UIControlApp && UIControlApp.handleResMax('1920x1080')}>1080p</button>
                <button className="dev-tools-btn" onClick={() => UIControlApp && UIControlApp.handleResMax('2560x1440')}>1440p</button>
              </div>
            </div>

            {/* ── Hovering Mouse ──────────────────────────────── */}
            <div className="dev-tools-section">
              <label className="dev-tools-label">Hovering Mouse</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn" onClick={() => UIControlApp && UIControlApp.toggleHoveringMouse(true)}>Enable</button>
                <button className="dev-tools-btn" onClick={() => UIControlApp && UIControlApp.toggleHoveringMouse(false)}>Disable</button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default App;
