import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StreamPixelApplication } from 'streampixelsdk';

let PixelStreamingApp;
let PixelStreamingUiApp;
let UIControlApp;

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
  },
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

  // Controls state
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState(null);

  // AFK state
  const [afkWarning, setAfkWarning] = useState(false);
  const [afkCountdown, setAfkCountdown] = useState(0);
  const dismissAfkRef = useRef(null);

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

    const { appStream, pixelStreaming, queueHandler, UIControl } = await StreamPixelApplication({
      AutoConnect: true,
      appId: projectId,
      streamerId: streamerId,
      sfuHost: sfuHost,
      sfuPlayer: sfuPlayer,
      forceTurn: true  //  true|false
    });

    PixelStreamingApp = pixelStreaming;
    PixelStreamingUiApp = appStream;
    UIControlApp = UIControl;

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
      setLoadingTitle('Disconnected');
      setLoadingSubtitle(LOADING_CONFIG.disconnectedSubtitle);
      setLoadingStatus(LOADING_CONFIG.statusMessages.disconnected);
      setIsLoading(true);
      setLoadingProgress(0);
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

    </div>
  );
};

export default App;
