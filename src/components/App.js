import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Streampixel, AuthError, EngineLoadError, SDK_VERSION } from '@streampixel/web-sdk';
import { VoiceChat } from '@streampixel/web-sdk/voice';

/* =========================================================================
   Streampixel Web SDK v2 example — @streampixel/web-sdk

   The SDK draws nothing except the video. It gives your code one `stream`
   object with typed states, events and errors. Everything you see in this
   file's render tree is example UI you own: copy it, restyle it, or
   replace it. (For ready-made screens instead, see @streampixel/ui.)

   Full reference: the README of @streampixel/web-sdk.
   ========================================================================= */
const SHOW_DEV_TOOLS = true;

/* =========================================================================
   CUSTOMIZATION: Loading Screen Configuration
   ========================================================================= */
const LOADING_CONFIG = {
  backgroundColor: '#18181A',
  accentColor: '#4e9cff',
  logoUrl: null, // e.g. '/Images/logo.png'
  title: 'Connecting to Stream',
  subtitle: 'Please wait while we set up your experience...',
  queueMessage: (position) => `You are in queue at position ${position}`,
  showSpinner: true,

  statusMessages: {
    initializing: 'Initializing...',
    preparing: 'Preparing your session...',          // Streampixel.create() is running
    connecting: 'Connecting to your application...', // states `idle` and `connecting`
    inQueue: 'Waiting in queue...',                  // state `queued`
    // The `progress` event tells the steps inside `connecting` apart:
    offer: 'Your application answered. Setting up the video...',
    answer: 'Establishing the video connection...',
    connected: 'Connected. Waiting for the first frame...',
    recovering: 'Restarting the stream...',          // state `recovering`
    reconnecting: 'Reconnecting to stream...',       // state `reconnecting`
    waitingForHost: 'Waiting for the host...',       // `reconnecting` with waitingForHost (shared-session viewer)
    // "Test locally" (?dev=<session id>): the stream comes from your own Unreal Editor.
    devConnecting: 'Waiting for your Unreal Editor to connect...',
    devWaiting: 'Unreal stopped streaming. Waiting for it to come back...',
  },

  reconnectingTitle: 'Reconnecting',
  reconnectingSubtitle: 'Please wait while we restore your session...',
  endedTitle: 'Session Ended',
  unavailableTitle: 'Stream Unavailable',
};

/* Map the SDK's states, and the steps of the `progress` event, onto the progress bar. */
const PROGRESS_BY_STATE = {
  idle: 10,
  queued: 15,
  connecting: 30,
  streaming: 100,
  awaitingPlay: 100,
  recovering: 20,
  reconnecting: 20,
};
const PROGRESS_BY_STAGE = { offer: 55, answer: 70, connected: 85 };

/* Download a PNG data URL (the Screenshot button, and a screenshot the application asked for). */
function savePng(dataUrl) {
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'streampixel-screenshot.png';
  a.click();
}

/* A dev session id as the dashboard's Test Locally tab shows it: dev- and six characters. */
const DEV_SESSION_ID = /^dev-[a-f0-9]{6}$/i;

/* The "Test locally" switch. On (a session id): reload this page with
   ?dev=<session id>, so the stream comes from your own Unreal Editor. Off
   (null): reload without it, back to the uploaded build. A dev session cannot
   be a shared session, so `shared` and `hostStreamerId` are dropped when it is
   switched on. Returns false when the id is not a dev session id. */
function switchTestLocally(sessionId) {
  const url = new URL(window.location.href);
  if (sessionId) {
    if (!DEV_SESSION_ID.test(sessionId)) return false;
    url.searchParams.set('dev', sessionId);
    url.searchParams.delete('shared');
    url.searchParams.delete('hostStreamerId');
  } else {
    url.searchParams.delete('dev');
  }
  window.location.assign(url.href);
  return true;
}

/* This example's URL parameters (see the README). Production is the default. */
function readUrlOptions() {
  const params = new URLSearchParams(window.location.search);
  // Shared session: ?shared=host, or ?shared=viewer&hostStreamerId=<id>
  const sharedParam = params.get('shared');
  const hostStreamerId = params.get('hostStreamerId');
  return {
    shared:
      sharedParam === 'host'
        ? { role: 'host' }
        : sharedParam === 'viewer' && hostStreamerId
          ? { role: 'viewer', hostStreamerId }
          : undefined,
    streamerId: params.get('streamerId') || undefined,
    // "Test locally": ?dev=dev-1a2b3c streams from your own Unreal Editor instead of
    // the uploaded build. The id comes from the dashboard's Test Locally tab.
    dev: DEV_SESSION_ID.test(params.get('dev') || '') ? { sessionId: params.get('dev') } : undefined,
    // ?engine=beta runs the next engine release instead of the stable one.
    engine: params.get('engine') === 'beta' ? { channel: 'beta' } : undefined,
  };
}

/* What to tell the viewer when Streampixel.create() rejects.
   `retry` offers a "Try again" button; `signInUrl` a "Sign in again" button. */
function describeCreateError(err) {
  if (err instanceof AuthError) {
    switch (err.kind) {
      case 'project-offline':
        return { subtitle: 'This stream is unavailable right now.', retry: true };
      case 'project-not-found':
        return { subtitle: 'This stream does not exist. Check the project id in the link.' };
      case 'rate-limited':
        return { subtitle: `Too many attempts. Try again in ${err.retryAfterSec ?? 60} seconds.`, retry: true };
      case 'network':
        return { subtitle: 'Could not reach Streampixel. Check your connection.', retry: true };
      case 'sso-required':
        // Single sign-on: the SDK is already sending the browser to the sign-in page.
        return { title: 'Signing in', subtitle: 'Taking you to the sign-in page...' };
      case 'sso-failed':
        // err.message is a sentence for the viewer; err.ssoStartUrl starts the sign-in again.
        return { subtitle: err.message, status: err.ssoErrorCode, signInUrl: err.ssoStartUrl };
      case 'server-ticket-required':
        // "Your app only": the project's owner must request a ticket on their server
        // and pass the whole response as auth: { mode: 'ticket', ticket }.
        return {
          subtitle: 'This stream can only be opened from its owner\'s own application.',
          status: 'Project access is "Your app only": a server ticket is required.',
        };
      case 'shared-room-taken':
        return { subtitle: 'This shared session already has a host.' };
      case 'dev-session-not-found':
        // "Test locally": the id is not a session of this project.
        return { subtitle: 'This dev session does not exist for this project.', status: 'Start one in the dashboard (Test Locally) and use its id.', leaveDev: true };
      case 'dev-session-expired':
        return { subtitle: 'This dev session has expired.', status: 'Start a new one in the dashboard (Test Locally).', leaveDev: true };
      default:
        // A newer engine may add a kind. err.status is the HTTP status, when there was one.
        return { subtitle: err.message, status: `${err.kind}${err.status ? ` (HTTP ${err.status})` : ''}`, retry: true };
    }
  }
  if (err instanceof EngineLoadError) {
    // The engine is downloaded by create(); err.reason says why that failed
    // (offline, an ad blocker, a Content-Security-Policy that does not allow the hosts, ...).
    return { subtitle: 'The player could not be loaded.', status: `Reason: ${err.reason}`, retry: true };
  }
  // TypeError: an option passed to create() is wrong. The message names it.
  return { subtitle: err?.message || 'The stream could not be started.' };
}

/* The line under the password form, from the fields of the `awaitingPassword` state. */
function passwordMessage(gate) {
  if (gate.hard) {
    // Every attempt is refused for now: the form is disabled until the wait is over.
    return `Too many attempts. Try again in ${gate.retryAfterSec ?? 60} seconds.`;
  }
  if (gate.locked) {
    // Too many wrong attempts. The right password is still accepted: the form stays usable.
    return 'Too many wrong attempts. Check the password before you try again.';
  }
  if (gate.wrong) return 'Incorrect password. Please try again.';
  return '';
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch (_) {
    return url;
  }
}

const App = () => {
  const streamRef = useRef(null);      // the current stream (Streampixel.create() result)
  const videoRef = useRef(null);       // the container the SDK puts its <video> in
  const latestStats = useRef(null);    // updated every second by the stats event

  // URL-derived config
  const [projectId, setProjectId] = useState(null);
  // `ended` is final: to start again, the old stream is destroyed and a new one
  // created. Changing this number re-runs the effect that does both.
  const [runId, setRunId] = useState(0);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTitle, setLoadingTitle] = useState(LOADING_CONFIG.title);
  const [loadingSubtitle, setLoadingSubtitle] = useState(LOADING_CONFIG.subtitle);
  const [queuePosition, setQueuePosition] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(LOADING_CONFIG.statusMessages.initializing);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingAction, setLoadingAction] = useState(null); // a button on the card: { label, run }

  // Password gate: the `awaitingPassword` state (fields wrong, locked, hard,
  // retryAfterSec) while the stream waits for submitPassword(); null otherwise.
  const [passwordGate, setPasswordGate] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // The browser blocked autoplay (state `awaitingPlay`): show "Click to start".
  const [needsPlay, setNeedsPlay] = useState(false);

  // Controls state
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [currentResolution, setCurrentResolution] = useState('Auto (Dashboard)');
  const [resolutionOptions, setResolutionOptions] = useState([]);

  // AFK state
  const [afkWarning, setAfkWarning] = useState(false);
  const [afkCountdown, setAfkCountdown] = useState(0);
  const dismissAfkRef = useRef(null);

  // On-screen keyboard (UE text fields): null = closed, string = current text
  const [oskText, setOskText] = useState(null);

  // Notices raised by events: `relayFallback`, `openUrl`, `fileProgress` / `file`
  const [relayNotice, setRelayNotice] = useState(null);   // 'tcp' | 'tls'
  const [linkPrompt, setLinkPrompt] = useState(null);     // { url, open }
  const [fileTransfer, setFileTransfer] = useState(null); // { name, percent } while arriving, { name, blob } when complete

  // Chat (voice/text via @streampixel/web-sdk/voice): available when the project
  // has chat switched on in the dashboard (stream.voiceToken is then set).
  const chatRef = useRef(null);
  const [chatAvailable, setChatAvailable] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatJoined, setChatJoined] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [micOn, setMicOn] = useState(false);
  const [roster, setRoster] = useState({ localParticipant: null, remoteParticipants: [] });
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const typingTimer = useRef(null);

  // Developer Tools state
  const [showDevTools, setShowDevTools] = useState(false);
  const [consoleCmd, setConsoleCmd] = useState('stat fps');
  const [uiInteractionJson, setUiInteractionJson] = useState('{"type":"setColor","value":"red"}');
  const [devNote, setDevNote] = useState('');           // result of the last send / console command
  const [sessionInfo, setSessionInfo] = useState(null); // { engineVersion, sessionId, streamerId }
  // "Test locally": the dev session id typed into Developer Tools (see handleTestLocally).
  const [devSessionInput, setDevSessionInput] = useState(() => new URLSearchParams(window.location.search).get('dev') || '');
  const activeDevSession = readUrlOptions().dev?.sessionId || null; // the page was opened with ?dev=<session id>
  // Picture quality as 1 to 4 bars, from the encoder's QP (lower QP = better picture). 0 = not known yet.
  const qualityBars = useRef(0);

  /* =====================================================================
     Parse project ID from the URL: /<projectId> or /?appId=<projectId>
     ===================================================================== */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathId = window.location.pathname.split('/').filter(Boolean).pop();
    setProjectId(params.get('appId') || pathId || null);
  }, []);

  const restart = useCallback(() => setRunId((n) => n + 1), []);

  /* A final card on the loading screen: the session ended, or create() failed. */
  const showFinalCard = useCallback(({ title, subtitle, status = '', action = null }) => {
    setIsLoading(true);
    setLoadingProgress(0); // hides the spinner and the progress bar
    setQueuePosition(null);
    setLoadingTitle(title);
    setLoadingSubtitle(subtitle);
    setLoadingStatus(status);
    setLoadingAction(action);
  }, []);

  /* =====================================================================
     Listen to a stream. Returns the function that removes every listener.
     ===================================================================== */
  const subscribe = useCallback((stream) => {
    /* ─── States → loading screen, password form, "Click to start" ───── */
    const onState = (s) => {
      const progress = PROGRESS_BY_STATE[s.kind];
      if (progress !== undefined) setLoadingProgress(progress);
      setPasswordGate(s.kind === 'awaitingPassword' ? s : null);
      setNeedsPlay(s.kind === 'awaitingPlay');

      switch (s.kind) {
        case 'idle':       // create() has resolved; connecting starts in a moment
        case 'connecting': // also after the queue, and while a connection is rebuilt
          setQueuePosition(null);
          // A dev session stays `connecting`, with no time limit, until Unreal connects.
          setLoadingStatus(readUrlOptions().dev ? LOADING_CONFIG.statusMessages.devConnecting : LOADING_CONFIG.statusMessages.connecting);
          break;
        case 'awaitingPassword':
          // A password project: nothing has started. The form below answers
          // with stream.submitPassword().
          break;
        case 'queued':
          setLoadingStatus(LOADING_CONFIG.statusMessages.inQueue);
          break;
        case 'streaming':
          setIsLoading(false);
          setLoadingTitle(LOADING_CONFIG.title);
          setLoadingSubtitle(LOADING_CONFIG.subtitle);
          setIsMuted(stream.muted); // streams start muted
          // Known once the stream has its ticket (on a password project: after the password).
          setChatAvailable(!!stream.voiceToken);
          setResolutionOptions([
            { label: 'Auto (Dashboard)', value: null },
            ...stream.allowedResolutions.map((r) => ({ label: r.split(' ')[0], value: r })),
          ]);
          break;
        case 'awaitingPlay':
          // The stream is up and the browser refused to play it without a user
          // gesture: the "Click to start" overlay calls stream.play().
          setIsLoading(false);
          break;
        case 'recovering':
          // No video arrived: the SDK is starting one fresh session.
          setIsLoading(true);
          setLoadingStatus(LOADING_CONFIG.statusMessages.recovering);
          break;
        case 'reconnecting':
          // The connection dropped: the SDK restores it until s.deadlineMs.
          setIsLoading(true);
          setLoadingTitle(LOADING_CONFIG.reconnectingTitle);
          setLoadingSubtitle(LOADING_CONFIG.reconnectingSubtitle);
          // waitingForHost: a shared-session viewer waiting for the host, or a dev
          // session waiting for your Unreal Editor (you stopped or restarted it).
          setLoadingStatus(
            s.waitingForHost
              ? (readUrlOptions().dev ? LOADING_CONFIG.statusMessages.devWaiting : LOADING_CONFIG.statusMessages.waitingForHost)
              : LOADING_CONFIG.statusMessages.reconnecting
          );
          break;
        case 'ended': // final: the `ended` event below shows the card
        default:      // a newer engine may add a kind
          break;
      }
    };

    const offs = [
      stream.on('state', onState),

      /* ─── Loading steps inside `connecting` ──────────────────────────── */
      stream.on('progress', ({ stage }) => {
        if (PROGRESS_BY_STAGE[stage] !== undefined) setLoadingProgress(PROGRESS_BY_STAGE[stage]);
        if (LOADING_CONFIG.statusMessages[stage]) setLoadingStatus(LOADING_CONFIG.statusMessages[stage]);
      }),

      stream.on('queue', ({ position }) => setQueuePosition(position)),

      /* ─── Session ids ────────────────────────────────────────────────── */
      // The ids shown in your Streampixel analytics: store them to link a session
      // to your own user. Fires again with new ids when the SDK recovers into a
      // fresh session.
      stream.on('session', ({ sessionId, streamerId }) => {
        setSessionInfo((info) => ({ ...info, sessionId, streamerId }));
      }),

      /* ─── Session end ────────────────────────────────────────────────── */
      // `message` is the sentence for the viewer. code, reason and endKind are
      // for your logs and for support.
      stream.on('ended', ({ code, reason, endKind, message }) => {
        console.info('[ended]', { code, reason, endKind });
        setAfkWarning(false);
        setOskText(null);
        setRelayNotice(null);
        setLinkPrompt(null);
        setFileTransfer(null);
        setChatOpen(false); // the chat leaves by itself when the stream ends
        showFinalCard({
          title: LOADING_CONFIG.endedTitle,
          subtitle: message,
          status: `Code ${code}`,
          // `ended` is final. "Start again" destroys this stream and creates a new one.
          action: { label: 'Start again', run: restart },
        });
      }),

      /* ─── Live stats (1s cadence), rendered when the popup is open ───── */
      // `?? '—'`: the engine is downloaded, and an older one may not send a field.
      stream.on('stats', (s) => {
        latestStats.current = {
          FPS: s.fps,
          'Latency (ms)': s.latencyMs,
          Resolution: s.resolution ?? '—',
          Codec: s.codec ?? '—',
          'Bitrate (kbps)': s.bitrateKbps ?? '—',
          'Encoder QP': s.avgQp ?? '—',
          Quality: qualityBars.current ? `${'▮'.repeat(qualityBars.current)}${'▯'.repeat(4 - qualityBars.current)}` : '—',
          'Frames Decoded': s.framesDecoded,
          'Frames Dropped': s.framesDropped,
          'Packets Lost': s.packetsLost ?? '—',
          'Received (MB)': s.bytesReceived == null ? '—' : (s.bytesReceived / 1e6).toFixed(1),
          Relay: s.relayTransport || 'direct',
        };
      }),

      /* ─── No video: the SDK recovers by itself (state `recovering`) ──── */
      stream.on('stalled', (diagnostics) => console.warn('[stalled]', diagnostics.verdict)),

      /* ─── Relay fallback ─────────────────────────────────────────────── */
      // UDP is blocked on the viewer's network and the stream is relayed over TCP
      // or TLS, at lower quality. showWarning is the project's dashboard setting.
      stream.on('relayFallback', ({ transport, showWarning }) => {
        if (showWarning) setRelayNotice(transport || 'tcp');
      }),

      /* ─── AFK countdown ──────────────────────────────────────────────── */
      stream.on('afkWarning', (w) => {
        if (w.kind === 'countdown') {
          setAfkWarning(true);
          setAfkCountdown(w.secondsRemaining);
          dismissAfkRef.current = w.dismiss;
        } else {
          setAfkWarning(false);
          dismissAfkRef.current = null;
        }
      }),

      /* ─── On-screen keyboard: UE focused a text field, or closed it ──── */
      stream.on('osk', ({ contents }) => setOskText(contents ?? '')),
      stream.on('oskHide', () => setOskText(null)),

      /* ─── The application sent a plain https link ────────────────────── */
      // Phones and tablets only open a tab from a tap: show a button that calls open().
      stream.on('openUrl', (link) => setLinkPrompt(link)),

      /* ─── The application sent a file ────────────────────────────────── */
      stream.on('fileProgress', ({ received, total, name }) => {
        setFileTransfer({ name: name || 'file', percent: total ? Math.round((received / total) * 100) : 0 });
      }),
      stream.on('file', ({ blob, name }) => setFileTransfer({ name: name || 'download', blob })),

      /* ─── The application asked for a screenshot ─────────────────────── */
      // The application sends `requestScreenshot`; the SDK captures the frame and
      // raises `screenshot`. Saved under this app's own file name. (Without a
      // listener the SDK downloads the PNG by itself.)
      stream.on('screenshot', ({ dataUrl }) => savePng(dataUrl)),

      /* ─── Encoder QP → quality bars ──────────────────────────────────── */
      // The application's average encoder QP, about once a second, on a 0 to 51
      // scale. Lower is a better picture. The bars are the "Quality" row of the
      // stats popup. (The same number is `avgQp` in the `stats` event.)
      stream.on('videoEncoderAvgQP', (avgQp) => {
        if (!(avgQp > 0)) return;
        if (avgQp <= 20) qualityBars.current = 4;
        else if (avgQp <= 26) qualityBars.current = 3;
        else if (avgQp <= 35) qualityBars.current = 2;
        else qualityBars.current = 1;
      }),

      /* ─── UE → Web messages ──────────────────────────────────────────── */
      stream.on('ueMessage', (message) => {
        // Handle custom UE → Web messages here. Usually a JSON string:
        // const data = JSON.parse(message);
        //
        // Two messages need no code here, because the SDK acts on them:
        //   - a plain https link raises `openUrl` (above). The link is offered
        //     as a button: phones and tablets open a tab only from a tap, so
        //     calling window.open() from this handler is blocked there.
        //   - `requestScreenshot` raises `screenshot` (above).
      }),
    ];


    // create() resolves already in `awaitingPassword` on a password project: render the current state now.
    onState(stream.state);

    return () => offs.forEach((off) => off());
  }, [restart, showFinalCard]);

  /* =====================================================================
     Start a stream; stop it when the component unmounts or restarts.

     React runs this effect twice in development (<StrictMode>), and a fast
     route change can unmount a component before create() has resolved. The
     AbortSignal covers both: aborted before create() resolves, nothing
     starts; aborted afterwards, the stream is destroyed. Without it, a
     session would keep streaming with nobody watching.
     ===================================================================== */
  useEffect(() => {
    if (!projectId) return undefined;
    const url = readUrlOptions();
    const ac = new AbortController();
    let stream = null;
    let unsubscribe = null;

    setIsLoading(true);
    setLoadingTitle(LOADING_CONFIG.title);
    setLoadingSubtitle(LOADING_CONFIG.subtitle);
    setLoadingStatus(LOADING_CONFIG.statusMessages.preparing);
    setLoadingProgress(5);
    setLoadingAction(null);

    /* ───────────────────────────────────────────────────────────────────
       Streampixel.create() downloads the engine, looks the project up,
       asks for the session ticket and resolves with the stream. Only
       `appId` is needed: codec, resolution, inputs and idle time default
       to the project's dashboard settings. Pass an option to change one.
       ─────────────────────────────────────────────────────────────────── */
    Streampixel.create({
      appId: projectId,
      container: videoRef.current,
      signal: ac.signal,
      shared: url.shared,
      dev: url.dev, // "Test locally": undefined for a normal session
      engine: url.engine,
      advanced: {
        streamerId: url.streamerId,
      },
      // auth:         { mode: 'ticket', ticket }, // "Your app only": the WHOLE response of your server's ticket request
      // codec:        { primary: 'AV1', fallback: 'H264' },
      // resolution:   { start: '1080p (1920x1080)', mode: 'dynamic' },
      // bitrate:      { min: 1_000, max: 20_000 }, // kilobits per second: 1 to 20 Mbps
      // input:        { mouse: true, keyboard: true, touch: true },
      // media:        { mic: false, camera: false },
      // launchParams: { unit: 'A-12', lang: 'fr' },
      // afk:          { timeoutSec: 300 },
      // telemetry:    'standard',
    })
      .then((created) => {
        if (ac.signal.aborted) return;
        stream = created;
        streamRef.current = stream;
        window.spStream = stream; // handy for the browser console
        setSessionInfo({ engineVersion: stream.engineVersion });
        // Attach listeners directly after create(): `session` and the first
        // `connecting` fire one moment later.
        unsubscribe = subscribe(stream);
      })
      .catch((err) => {
        // The cleanup below aborted `signal` (create() rejects with AbortError): nothing started.
        if (ac.signal.aborted || err?.name === 'AbortError') return;
        console.error('[create]', err);
        const { title, subtitle, status, retry, signInUrl, leaveDev } = describeCreateError(err);
        let action = null;
        if (signInUrl) action = { label: 'Sign in again', run: () => window.location.assign(signInUrl) };
        else if (leaveDev) action = { label: 'Back to the uploaded build', run: () => switchTestLocally(null) };
        else if (retry) action = { label: 'Try again', run: restart };
        showFinalCard({ title: title || LOADING_CONFIG.unavailableTitle, subtitle, status, action });
      });

    return () => {
      unsubscribe?.();   // destroy() announces `ended` before it drops listeners: stop listening first
      ac.abort();        // before create() resolves: nothing starts. After: the stream is destroyed.
      stream?.destroy(); // a stream that has already ended no longer follows the signal; safe to call twice
      streamRef.current = null;

      // Forget what belonged to that stream.
      chatRef.current?.leave().catch(() => {});
      chatRef.current = null;
      latestStats.current = null;
      dismissAfkRef.current = null;
      setChatAvailable(false);
      setChatOpen(false);
      setChatJoined(false);
      setChatMessages([]);
      setMicOn(false);
      setPasswordGate(null);
      setPasswordError('');
      setNeedsPlay(false);
      setAfkWarning(false);
      setOskText(null);
      setRelayNotice(null);
      setLinkPrompt(null);
      setFileTransfer(null);
      setStatsData(null);
      setSessionInfo(null);
      setDevNote('');
      setResolutionOptions([]);
      setCurrentResolution('Auto (Dashboard)');
    };
  }, [projectId, runId, subscribe, showFinalCard, restart]);

  // Hard lockout on the password form: every attempt is refused for now.
  // Clear it when the wait is over, so the form can be used again.
  useEffect(() => {
    if (!passwordGate?.hard) return undefined;
    const timer = setTimeout(
      () => setPasswordGate((gate) => (gate ? { kind: 'awaitingPassword' } : gate)),
      (passwordGate.retryAfterSec ?? 60) * 1000
    );
    return () => clearTimeout(timer);
  }, [passwordGate]);

  /* =====================================================================
     Event Handlers
     ===================================================================== */

  const handlePasswordSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const stream = streamRef.current;
      if (!stream || !password || passwordBusy) return;
      setPasswordBusy(true);
      setPasswordError('');
      // Resolves for a right AND for a wrong password: the `awaitingPassword`
      // state says which (wrong / locked / hard). Rejects with AuthError for a
      // network error or a project that went offline; the state stays as it was.
      stream
        .submitPassword(password)
        .catch((err) => setPasswordError(err.message))
        .finally(() => setPasswordBusy(false));
    },
    [password, passwordBusy]
  );

  // `awaitingPlay`: playback must start from a click or tap.
  const handlePlay = useCallback(() => {
    streamRef.current?.play();
  }, []);

  const handleDismissAfk = useCallback(() => {
    dismissAfkRef.current?.();
  }, []);

  const submitOsk = useCallback(() => {
    if (oskText !== null) streamRef.current?.sendTextboxEntry(oskText);
    setOskText(null);
  }, [oskText]);

  // `openUrl`: open() must run inside this click.
  const openLink = useCallback(() => {
    linkPrompt?.open();
    setLinkPrompt(null);
  }, [linkPrompt]);

  // `file`: save the Blob the application sent.
  const saveFile = useCallback(() => {
    if (!fileTransfer?.blob) return;
    const url = URL.createObjectURL(fileTransfer.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileTransfer.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    setFileTransfer(null);
  }, [fileTransfer]);

  /* ─── Chat: lazy-join the project room on first open ────────────────── */
  const openChat = useCallback(async () => {
    setChatOpen(true);
    const stream = streamRef.current;
    if (chatRef.current || !stream) return;
    try {
      // VoiceChat.for() returns a Promise: the chat code is downloaded on first use.
      const chat = await VoiceChat.for(stream, {
        userName: `Guest-${Math.floor(Math.random() * 1000)}`,
        voice: false, // join muted; mic is opt-in below
      });
      chat.on('message', (m) =>
        setChatMessages((prev) => [...prev.slice(-99), { ...m, ts: Date.now() }])
      );
      chat.on('roster', setRoster);
      chat.on('typing', () => {
        setSomeoneTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setSomeoneTyping(false), 2500);
      });
      chat.on('deviceError', (e) => console.warn('[chat]', e.message));
      await chat.join();
      if (streamRef.current !== stream) {
        // The stream was replaced while the chat was joining.
        chat.leave().catch(() => {});
        return;
      }
      chatRef.current = chat;
      setChatJoined(true);
    } catch (err) {
      console.error('Chat join failed:', err.message);
      setChatMessages((prev) => [...prev, { from: 'system', text: `Chat unavailable: ${err.message}`, ts: Date.now() }]);
    }
  }, []);

  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    chatRef.current?.sendMessage(text);
    setChatInput('');
  }, [chatInput]);

  const toggleChatMic = useCallback(async () => {
    const next = !micOn;
    const ok = await chatRef.current?.toggleMic(next);
    setMicOn(next && ok !== false);
  }, [micOn]);

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const toggleMute = useCallback(() => {
    const audible = streamRef.current?.toggleAudio();
    setIsMuted(!audible);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // While the stats popup is open, refresh from the 1s stats feed.
  useEffect(() => {
    if (!showStats) return undefined;
    setStatsData(latestStats.current);
    const id = setInterval(() => setStatsData({ ...(latestStats.current || {}) }), 1000);
    return () => clearInterval(id);
  }, [showStats]);

  const toggleStats = useCallback(() => setShowStats((prev) => !prev), []);
  const toggleSettings = useCallback(() => setShowSettings((prev) => !prev), []);

  const handleResolutionChange = useCallback((option) => {
    setShowSettings(false);
    if (option.value) {
      const match = option.value.match(/\((\d+)x(\d+)\)/);
      // Returns the size that was sent (lowered to the project's maximum), or
      // null when nothing was sent: no stream up, or a shared-session viewer
      // (the size is the host's).
      const applied = match && streamRef.current?.setResolution(Number(match[1]), Number(match[2]));
      if (!applied) {
        console.warn('[resolution] not applied:', option.value);
        return;
      }
    }
    setCurrentResolution(option.label);
  }, []);

  /* ─── Developer Tools Handlers ───────────────────────────────────── */

  // send() and consoleCommand() return whether anything was sent. Nothing is
  // queued: send again once the state is `streaming`.
  const handleConsoleCommand = useCallback((cmd) => {
    const sent = streamRef.current?.consoleCommand(cmd);
    setDevNote(
      sent
        ? `Sent: ${cmd}`
        : 'Not sent. The stream is not up, or the application does not allow console commands (-AllowPixelStreamingCommands).'
    );
  }, []);

  const handleSendToUE = useCallback((jsonStr) => {
    let payload;
    try {
      payload = JSON.parse(jsonStr);
    } catch (e) {
      setDevNote(`Invalid JSON: ${e.message}`);
      return;
    }
    const sent = streamRef.current?.send(payload);
    setDevNote(sent ? 'Sent to the application.' : 'Not sent. The stream is not up.');
  }, []);

  // Ends the session for good: `ended` fires with code 1000 and endKind 'user'.
  const handleDisconnect = useCallback(() => {
    streamRef.current?.disconnect();
  }, []);

  const handleScreenshot = useCallback(() => {
    savePng(streamRef.current?.captureScreenshot());
  }, []);

  /* The "Test locally" switch in Developer Tools (see switchTestLocally above). */
  const handleTestLocally = useCallback((sessionId) => {
    if (!switchTestLocally(sessionId)) {
      setDevNote('A dev session id looks like dev-1a2b3c: copy it from the Test Locally tab of the dashboard.');
    }
  }, []);

  const handleDiagnostics = useCallback(async () => {
    const diag = await streamRef.current?.getDiagnostics();
    console.log('[diagnostics]', diag);
    if (diag) window.alert(`Connection: ${diag.verdict}`);
    else setDevNote('No connection to diagnose.');
  }, []);

  /* =====================================================================
     Render — everything below is EXAMPLE UI. The SDK draws only the video.
     ===================================================================== */
  return (
    <div className="containMain">

      {/* Password Gate — state `awaitingPassword`, answered with stream.submitPassword() */}
      {passwordGate && (
        <div className="loading-overlay" style={{ backgroundColor: LOADING_CONFIG.backgroundColor }}>
          {LOADING_CONFIG.logoUrl && (
            <img src={LOADING_CONFIG.logoUrl} alt="Logo" className="loading-logo" />
          )}
          <h2 className="loading-title">Password Required</h2>
          <p className="loading-subtitle">This stream is protected.</p>
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              type="password"
              value={password}
              autoFocus
              disabled={passwordGate.hard === true}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #333', background: '#101012', color: '#eee' }}
            />
            <button
              type="submit"
              disabled={passwordGate.hard === true || passwordBusy}
              style={{
                padding: '10px 16px', borderRadius: 6, border: 'none', background: LOADING_CONFIG.accentColor, color: '#fff',
                cursor: 'pointer', opacity: passwordGate.hard === true || passwordBusy ? 0.6 : 1,
              }}
            >
              {passwordBusy ? 'Checking...' : 'Join'}
            </button>
          </form>
          {(passwordError || passwordMessage(passwordGate)) && (
            <p className="loading-status" style={{ color: '#ff7b7b' }}>
              {passwordError || passwordMessage(passwordGate)}
            </p>
          )}
        </div>
      )}

      {/* Loading / Ended / Unavailable Screen */}
      {isLoading && !passwordGate && (
        <div className="loading-overlay" style={{ backgroundColor: LOADING_CONFIG.backgroundColor }}>
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
                style={{ width: `${loadingProgress}%`, backgroundColor: LOADING_CONFIG.accentColor }}
              />
            </div>
          )}
          <p className="loading-status">{loadingStatus}</p>
          {loadingAction && (
            <button
              className="afk-btn"
              style={{ backgroundColor: LOADING_CONFIG.accentColor, marginTop: 8 }}
              onClick={loadingAction.run}
            >
              {loadingAction.label}
            </button>
          )}
          {queuePosition !== null && (
            <div className="loading-queue">
              <p className="loading-queue-text">{LOADING_CONFIG.queueMessage(queuePosition)}</p>
              <div className="loading-queue-badge" style={{ backgroundColor: LOADING_CONFIG.accentColor }}>
                #{queuePosition}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Container — the SDK puts its <video> in here. Keep it empty in
          your JSX, and give it a width and a height (see index.css). */}
      <div id="videoElement" ref={videoRef} />

      {/* Click to start — state `awaitingPlay`: the browser blocked autoplay */}
      {needsPlay && (
        <div className="afk-overlay" onClick={handlePlay}>
          <div className="afk-card">
            <h2 className="afk-title">Your stream is ready</h2>
            <p className="afk-subtitle">Your browser needs a click before it plays video.</p>
            {/* The click bubbles to the overlay: a press anywhere calls stream.play() */}
            <button className="afk-btn" style={{ backgroundColor: LOADING_CONFIG.accentColor }}>
              Click to start
            </button>
          </div>
        </div>
      )}

      {/* Notices — events `relayFallback`, `openUrl`, `fileProgress` and `file` */}
      {(relayNotice || linkPrompt || fileTransfer) && (
        <div className="notice-stack">
          {relayNotice && (
            <div className="notice">
              <span>
                Your network is blocking UDP, so the stream is relayed over {relayNotice.toUpperCase()},
                which reduces quality.
              </span>
              <button className="dev-tools-btn" onClick={() => setRelayNotice(null)}>Dismiss</button>
            </div>
          )}
          {linkPrompt && (
            <div className="notice">
              <span>The application wants to open {hostOf(linkPrompt.url)}</span>
              <button className="dev-tools-btn" onClick={openLink}>Open</button>
              <button className="dev-tools-btn" onClick={() => setLinkPrompt(null)}>Stay here</button>
            </div>
          )}
          {fileTransfer && (
            <div className="notice">
              {fileTransfer.blob ? (
                <>
                  <span>{fileTransfer.name} is ready.</span>
                  <button className="dev-tools-btn" onClick={saveFile}>Save</button>
                  <button className="dev-tools-btn" onClick={() => setFileTransfer(null)}>Dismiss</button>
                </>
              ) : (
                <span>Receiving {fileTransfer.name}... {fileTransfer.percent}%</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* AFK Warning Overlay */}
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

      {/* Chat (voice/text) — shown when the project has chat enabled */}
      {chatAvailable && !isLoading && (
        <button
          onClick={() => (chatOpen ? setChatOpen(false) : openChat())}
          title="Chat"
          style={{
            position: 'fixed', bottom: 20, left: 20, zIndex: 10010,
            width: 44, height: 44, borderRadius: 22, border: 'none', cursor: 'pointer',
            background: chatOpen ? LOADING_CONFIG.accentColor : 'rgba(20,20,26,.85)',
            color: '#fff', fontSize: 20,
          }}
        >
          💬
        </button>
      )}
      {chatOpen && (
        <div
          style={{
            position: 'fixed', bottom: 74, left: 20, zIndex: 10010, width: 300,
            maxHeight: '55vh', display: 'flex', flexDirection: 'column',
            background: 'rgba(16,16,20,.95)', border: '1px solid #2c2c34',
            borderRadius: 12, color: '#e8e8ec', font: '13px/1.5 system-ui, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #26262e' }}>
            <strong style={{ flex: 1 }}>
              Chat {chatJoined ? `· ${1 + roster.remoteParticipants.length} online` : '· joining…'}
            </strong>
            <button
              onClick={toggleChatMic}
              title={micOn ? 'Mute mic' : 'Unmute mic'}
              style={{ border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                background: micOn ? LOADING_CONFIG.accentColor : '#3a3a42', color: '#fff' }}
            >
              {micOn ? '🎙' : '🔇'}
            </button>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {chatMessages.length === 0 && <span style={{ opacity: .5 }}>No messages yet.</span>}
            {chatMessages.map((m, i) => (
              <div key={i}>
                <span style={{ color: m.from === 'You' ? LOADING_CONFIG.accentColor : '#9ab', fontWeight: 600 }}>{m.from}</span>{' '}
                <span>{m.text}</span>
              </div>
            ))}
            {someoneTyping && <span style={{ opacity: .5, fontStyle: 'italic' }}>someone is typing…</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid #26262e' }}>
            <input
              value={chatInput}
              onChange={(e) => { setChatInput(e.target.value); chatRef.current?.sendTyping(); }}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') sendChat(); }}
              placeholder="Message…"
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a42', background: '#101014', color: '#eee', outline: 'none' }}
            />
            <button onClick={sendChat} style={{ border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', background: LOADING_CONFIG.accentColor, color: '#fff' }}>Send</button>
          </div>
        </div>
      )}

      {/* On-screen keyboard modal — UE requested text input */}
      {oskText !== null && (
        <div className="afk-overlay" onClick={() => setOskText(null)}>
          <div className="afk-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="afk-title">Enter text</h2>
            <p className="afk-subtitle">The application is asking for input</p>
            <input
              type="text"
              value={oskText}
              autoFocus
              onChange={(e) => setOskText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') submitOsk();
                if (e.key === 'Escape') setOskText(null);
              }}
              style={{
                width: '100%', boxSizing: 'border-box', margin: '12px 0',
                padding: '12px 14px', borderRadius: 8, border: '1px solid #3a3a3e',
                background: '#101012', color: '#eee', fontSize: 15, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                className="afk-btn"
                style={{ backgroundColor: LOADING_CONFIG.accentColor }}
                onClick={submitOsk}
              >
                Send
              </button>
              <button
                className="afk-btn"
                style={{ backgroundColor: '#3a3a3e' }}
                onClick={() => setOskText(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Controls */}
      {!isLoading && (
        <div className="stream-controls">
          <button className="control-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
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

          <button className="control-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
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

          <button className={`control-btn ${showStats ? 'control-btn-active' : ''}`} onClick={toggleStats} title="Stream Info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>

          {resolutionOptions.length > 1 && (
            <button className={`control-btn ${showSettings ? 'control-btn-active' : ''}`} onClick={toggleSettings} title="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}

          {SHOW_DEV_TOOLS && (
            <button className={`control-btn ${showDevTools ? 'control-btn-active' : ''}`} onClick={() => setShowDevTools((prev) => !prev)} title="Developer Tools">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Stats Popup — live data from the SDK's `stats` event */}
      {showStats && (
        <div className="stats-popup">
          <div className="stats-popup-header">
            <span className="stats-popup-title">Stream Info</span>
            <button className="stats-popup-close" onClick={() => setShowStats(false)}>&times;</button>
          </div>
          <div className="stats-popup-body">
            {statsData && Object.keys(statsData).length > 0 ? (
              Object.entries(statsData).map(([key, val]) => (
                <div className="stats-row" key={key}>
                  <span className="stats-label">{key}</span>
                  <span className="stats-value">{String(val)}</span>
                </div>
              ))
            ) : (
              <p className="stats-empty">Waiting for stream statistics...</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Popup (Resolution — options come from stream.allowedResolutions) */}
      {showSettings && (
        <div className="settings-popup">
          <div className="stats-popup-header">
            <span className="stats-popup-title">Quality</span>
            <button className="stats-popup-close" onClick={() => setShowSettings(false)}>&times;</button>
          </div>
          <div className="settings-popup-body">
            {resolutionOptions.map((option) => (
              <button
                key={option.label}
                className={`settings-option ${currentResolution === option.label ? 'settings-option-active' : ''}`}
                onClick={() => handleResolutionChange(option)}
              >
                <span>{option.label}</span>
                {currentResolution === option.label && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Developer Tools Panel */}
      {SHOW_DEV_TOOLS && showDevTools && (
        <div className="dev-tools-popup">
          <div className="stats-popup-header">
            <span className="stats-popup-title">Developer Tools (SDK {SDK_VERSION})</span>
            <button className="stats-popup-close" onClick={() => setShowDevTools(false)}>&times;</button>
          </div>
          <div className="stats-popup-body">
            {devNote && <p className="dev-tools-note">{devNote}</p>}
            <div className="dev-tools-section">
              <label className="dev-tools-label">Console Command</label>
              <div className="dev-tools-row">
                <input className="dev-tools-input" type="text" value={consoleCmd} onChange={(e) => setConsoleCmd(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleConsoleCommand(consoleCmd); }} placeholder="e.g. stat fps" />
                <button className="dev-tools-btn" onClick={() => handleConsoleCommand(consoleCmd)}>Send</button>
              </div>
            </div>
            <div className="dev-tools-section">
              <label className="dev-tools-label">UI Interaction (JSON)</label>
              <div className="dev-tools-row">
                <input className="dev-tools-input" type="text" value={uiInteractionJson} onChange={(e) => setUiInteractionJson(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleSendToUE(uiInteractionJson); }} placeholder='{"type":"action","value":"..."}' />
                <button className="dev-tools-btn" onClick={() => handleSendToUE(uiInteractionJson)}>Send</button>
              </div>
            </div>
            {/* Test locally: stream from your own Unreal Editor (the SDK's `dev` option).
                Start a session in the dashboard's Test Locally tab, connect Unreal to
                it, and enter the session id here. */}
            <div className="dev-tools-section">
              <label className="dev-tools-label">Test locally (your Unreal Editor)</label>
              {activeDevSession ? (
                <div className="dev-tools-row">
                  <p className="dev-tools-note">On: {activeDevSession}</p>
                  <button className="dev-tools-btn" onClick={() => handleTestLocally(null)}>Switch off</button>
                </div>
              ) : (
                <div className="dev-tools-row">
                  <input className="dev-tools-input" type="text" value={devSessionInput} onChange={(e) => setDevSessionInput(e.target.value.trim())} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleTestLocally(devSessionInput); }} placeholder="dev-1a2b3c" />
                  <button className="dev-tools-btn" onClick={() => handleTestLocally(devSessionInput)}>Switch on</button>
                </div>
              )}
            </div>
            <div className="dev-tools-section">
              <label className="dev-tools-label">Diagnostics & Capture</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn" onClick={handleDiagnostics}>Diagnostics</button>
                <button className="dev-tools-btn" onClick={handleScreenshot}>Screenshot</button>
              </div>
            </div>
            <div className="dev-tools-section">
              <label className="dev-tools-label">Hovering Mouse</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn" onClick={() => streamRef.current?.setHoverMouse(true)}>Enable</button>
                <button className="dev-tools-btn" onClick={() => streamRef.current?.setHoverMouse(false)}>Disable</button>
              </div>
            </div>
            <div className="dev-tools-section">
              <label className="dev-tools-label">Connection</label>
              <div className="dev-tools-row">
                <button className="dev-tools-btn dev-tools-btn-danger" onClick={handleDisconnect}>Disconnect</button>
              </div>
            </div>
            {/* The engine is downloaded by create(), so its version can differ from the
                package's. The ids are from the `session` event; a shared-session host
                gives its streamer id to viewers. */}
            {sessionInfo && (
              <div className="dev-tools-section">
                <label className="dev-tools-label">Session</label>
                <p className="dev-tools-note">Engine: {sessionInfo.engineVersion}</p>
                {sessionInfo.sessionId && <p className="dev-tools-note">Session id: {sessionInfo.sessionId}</p>}
                {sessionInfo.streamerId && <p className="dev-tools-note">Streamer id: {sessionInfo.streamerId}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
