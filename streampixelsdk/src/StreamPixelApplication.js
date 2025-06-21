const { PixelStreaming,Config,NumericParameters,Flags, OptionParameters } = require('@epicgames-ps/lib-pixelstreamingfrontend-ue5.5');
const mixpanel = require('mixpanel-browser');
const CustomApplication = require('./CustomApplication');
const UIControllerNew = require('./UIControllerNew');
const userAgent = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
const ua = userAgent.toLowerCase();

const isAndroid = /android/i.test(ua);
const isIOS = /iphone|ipad|ipod/i.test(ua);
const isFirefox = ua.includes('firefox');

const isTablet = /ipad|tablet|(android(?!.*mobile))/i.test(ua);
const isMobile = /iphone|ipod|android.*mobile|windows phone/i.test(ua);
const isDesktop = !isMobile && !isTablet;

function getRandom4DigitNumber() {
    return Math.floor(Math.random() * 9000) + 1000;
}


mixpanel.init('69e44f58269e474745bd273dcdd561cc', {
    api_host: 'https://mixapi.streampixel.io' ,
    record_mask_text_class: null,
    record_mask_text_selector:null,	
    debug: true,    
});

let message;
let _sdkInitialized = false;

function showLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.classList.add('loading-spinner');
    spinner.style.cssText = `
        position: absolute;
        top: 35%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
    `;
    spinner.innerHTML = `
        <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="#3498db" stroke-width="8" fill="none" />
            <circle cx="50" cy="50" r="40" stroke="#f3f3f3" stroke-width="8" fill="none" stroke-dasharray="251" stroke-dashoffset="50" transform="rotate(-90 50 50)">
                <animate attributeName="stroke-dashoffset" values="251;0" dur="1s" repeatCount="indefinite"/>
            </circle>
        </svg>
    `;
    document.body.appendChild(spinner);
}

function hideLoadingSpinner() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}


const queueListeners = [];

function queueHandler(callback) {
    if (typeof callback === "function") {
        queueListeners.push(callback);
    }
}

async function getProjectDetails(projectId) {
    try {
        const response = await fetch(`https://api.streampixel.io/pixelStripeApi/projects/streamAuth/${projectId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const projectData = await response.json();

        if (window.location.hostname === "localhost") {
            return projectData;
        }

        const validUrls = projectData.validPathUrl;

        if (Array.isArray(validUrls) && validUrls.length > 0) {
            const currentOrigin = window.location.origin;

            const isValid = validUrls.some(url => {
                if (url.includes('*')) {
                    return currentOrigin.includes(url.split('*')[1]);
                }
                return currentOrigin.includes(url);
            });

            if (isValid) {
                return projectData;
            }
        }
        return null;

    } catch (error) {
        console.error('Error fetching project data:', error);
        return null;
    }
}


async function StreamPixelApplication(settings) {

    if (_sdkInitialized) {
        console.warn(" StreamPixelApplication called more than once — skipping.");
        return {};
    }


  

    _sdkInitialized = true;
    const projectData = await getProjectDetails(settings.appId);


if(projectData != null){

    let streamerId = getRandom4DigitNumber();
    let ssUrl ;
    const startTime = Date.now();


    let resx;
    let resy;
    let maxHeight;
    let maxWidth;

    
    const getResolutionData = (resString) => {
      const match = resString?.match(/\((\d+x\d+)\)/);
      if (!match) return null;

      const [width, height] = match[1].split('x');
      return { resolution: resString, width, height };
    };



    let resData;
    if (isMobile) resData = getResolutionData(projectData.startResolutionMobile);
    else if (isTablet) resData = getResolutionData(projectData.startResolutionTab);
    else if (isDesktop) resData = getResolutionData(projectData.startResolution);

    if (resData) {
      maxWidth = resData.width;
      maxHeight = resData.height;
    }

    if(projectData.resolutionMode == "Fixed Resolution Mode"){

      resx = maxWidth
      resy = maxHeight;
   }
     if (["Dynamic Resolution Mode", "Crop on Resize Mode"].includes(projectData.resolutionMode)) {

     let viewportH = Math.floor(window.innerHeight* window.devicePixelRatio); 
     let viewportW = Math.floor(window.innerWidth* window.devicePixelRatio);
     let maxPixel = Math.floor(maxHeight*maxWidth);
     let viewportPixel = viewportH*viewportW;
 
 
     if(maxPixel > viewportPixel){
 
       resy =viewportH;
       resx  = viewportW;

 
     }else{
 
     let divideNumber = Math.min(maxWidth/viewportW,maxHeight/viewportH);
 
 
     let resW = Math.floor(divideNumber * viewportW );
     let resH = Math.floor(divideNumber * viewportH );

     resy =resH;
     resx  = resW;
   }
  }

  

    mixpanel.track('Stream Start', {
        "sessionId": streamerId,
        "projectId": settings.appId,
        "projectRegion":projectData.region
    });

    if (projectData.region === "US-East-1") {
        ssUrl = "wss://us1signalling.streampixel.io/?StreamerId="+streamerId+"&ProjectId="+settings.appId+"&resx="+resx+"&resY="+resy;
    } else if (projectData.region === "Europe") {
        ssUrl = "wss://eu1signalling.streampixel.io/?StreamerId="+streamerId+"&ProjectId="+settings.appId+"&resX="+resx+"&resY="+resy;
    } else {
        ssUrl = "wss://signalling.streampixel.io/?StreamerId="+streamerId+"&ProjectId="+settings.appId+"&resX="+resx+"&resY="+resy;
    }

    const initialSettings = {
        AutoConnect: settings.AutoConnect,
        ss: ssUrl,
        WaitForStreamer: false,
        StreamerId: streamerId,
        TouchInput: projectData.touchInput,
        XRControllerInput: projectData.xrInput,
    };

    const config = new Config({ initialSettings });



    const browserSupportedCodecs = [];
    let selectedCodec;
                      
    if (!RTCRtpReceiver.getCapabilities) {
        browserSupportedCodecs.push('Only available on Chrome');
        return browserSupportedCodecs;
    }

    const matcher = /(VP\d|H26\d|AV1).*/;
    const codecs = RTCRtpReceiver.getCapabilities('video').codecs;

    codecs.forEach((codec) => {
        const str = codec.mimeType.split('/')[1] + ' ' + (codec.sdpFmtpLine || '');
        const match = matcher.exec(str);
        if (match !== null) {
            browserSupportedCodecs.push(str);
        }
    });

    if (Array.isArray(browserSupportedCodecs) && projectData.primaryCodec && projectData.fallbaCodec) {
        const pCodeArray = browserSupportedCodecs.filter(item =>
            item.toLowerCase().includes(projectData.primaryCodec.toLowerCase())
        );

        const hasAVInPrimary = pCodeArray.some(item => item.toLowerCase().includes("av"));
    
        if (hasAVInPrimary) {
            if (pCodeArray.length > 0 && pCodeArray[0] && pCodeArray[0].length < 6) {
                handleFallback();
            } else if (settings.unrealVersion > 5.3) {
                if (!isFirefox) {
                    config.setOptionSettingOptions("PreferredCodec", pCodeArray);
                }
                config.setOptionSettingValue(OptionParameters.PreferredCodec, pCodeArray[0]);
                selectedCodec = projectData.primaryCodec;
            } else {
                handleFallback();
            }
        } else if (pCodeArray.length > 0) {
            if(!isFirefox){
            config.setOptionSettingOptions("PreferredCodec", pCodeArray);
            }
            config.setOptionSettingValue(OptionParameters.PreferredCodec, pCodeArray[0]);
            selectedCodec = projectData.primaryCodec;

        } else {
            handleFallback();
        }
    } else {
        console.error("Invalid inputs: Ensure browserSupportedCodecs is an array and settings contain valid codecs.");
    }
    

    function handleFallback() {
        const fCodearray = browserSupportedCodecs.filter(item =>
            item.toLowerCase().includes(projectData.fallbaCodec.toLowerCase())
        );
    
        if (fCodearray.length === 0) {
            config.setOptionSettingOptions("PreferredCodec", browserSupportedCodecs);
            selectedCodec = "H264"; 
        } else {
            const hasAVInFallback = fCodearray.some(item => item.toLowerCase().includes("av"));
            
            if (hasAVInFallback) {
                if (fCodearray[0].length < 6) {
                    config.setOptionSettingOptions("PreferredCodec", browserSupportedCodecs);
                    selectedCodec = "H264";  
                } else if (settings.unrealVersion > 5.3) {
                    if (!isFirefox) {
                        config.setOptionSettingOptions("PreferredCodec", fCodearray);
                    }
                    config.setOptionSettingValue(OptionParameters.PreferredCodec, fCodearray[0]);
                    selectedCodec = projectData.fallbaCodec;
                } else {
                    config.setOptionSettingOptions("PreferredCodec", browserSupportedCodecs);
                    selectedCodec = "H264";
                }
            } else {
                if (!isFirefox) {
                    config.setOptionSettingOptions("PreferredCodec", fCodearray);
                }
                if (fCodearray.length > 0) {
                    config.setOptionSettingValue(OptionParameters.PreferredCodec, fCodearray[0]);
                    selectedCodec = projectData.fallbaCodec;
                } else {
                    selectedCodec = "H264";
                }
            }
        }
    
    }

    config.setFlagEnabled(Flags.ForceTURN, true);
    config.setFlagEnabled(Flags.MatchViewportResolution, false);
    config.setFlagEnabled(Flags.TouchInput, true);
    config.setFlagEnabled(Flags.FakeMouseWithTouches, settings.fakeMouseWithTouches ?? projectData.fakeMouseWithTouches);
    config.setFlagEnabled(Flags.StartVideoMuted, true);
    config.setFlagEnabled(Flags.BrowserSendOffer, false);
    config.setFlagEnabled(Flags.AFKDetection, true);
    config.setFlagEnabled(Flags.ForceMonoAudio, false);
    config.setFlagEnabled(Flags.AutoPlayVideo, true);
    config.setFlagEnabled(Flags.HideUI, true);
    config.setFlagEnabled(Flags.GamepadInput, settings.GamepadInput ?? projectData.gamepadInput);
    config.setFlagEnabled(Flags.HoveringMouseMode, settings.hoverMouse ?? projectData.hoverMouse);
    config.setFlagEnabled(Flags.MouseInput, settings.mouseInput ?? projectData.mouseInput);
    config.setFlagEnabled(Flags.IsQualityController, true);
    config.setFlagEnabled(Flags.KeyboardInput, settings.keyBoardInput ?? projectData.keyBoardInput);
    config.setFlagEnabled(Flags.UseMic, settings.useMic ?? projectData.useMic);
    
    config.setNumericSetting(NumericParameters.WebRTCFPS, 60);
    config.setNumericSetting(NumericParameters.MaxQP, projectData.maxQp ?? 40);
    config.setNumericSetting(NumericParameters.MinQP, projectData.minQP ?? 20);
    config.setNumericSetting(NumericParameters.AFKTimeoutSecs, settings.afktimeout ?? projectData.afktimeout);
    config.setNumericSetting(NumericParameters.WebRTCMinBitrate, projectData.minBitrate ?? 100);
    config.setNumericSetting(NumericParameters.WebRTCMaxBitrate, projectData.maxBitrate ?? 1000000);
    config.setNumericSetting(NumericParameters.StreamerAutoJoinInterval, 3000);
    config.setNumericSetting(NumericParameters.MaxReconnectAttempts, 0);

    const pixelStreaming = new PixelStreaming(config);

    const uiOptions = {
        settingsPanelConfig: false,
        stream: pixelStreaming,
    };

    const appStream = new CustomApplication(uiOptions);

    // Mobile AFK handling
    let visibilityTimeout;
    if (isAndroid || isIOS) {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                visibilityTimeout = setTimeout(() => {
                    appStream.stream.disconnect();
                }, 60000);
            } else {
                clearTimeout(visibilityTimeout);
            }
        });
    }

    const uiControlOptions = {
        showBtnVolume: projectData.showBtnVolume,
        showFullScreenBtn: projectData.showBtn,
        appStream:appStream,
        resolutionMode:projectData.resolutionMode,
        maxHeight:maxHeight,
        maxWidth:maxWidth
    };

    let UIControl;

    UIControl = new UIControllerNew( uiControlOptions );

    // Stream state messages
    const postState = (value) => {
        window.parent.postMessage({ type: "stream-state", value }, "*");
    };


    const getStats = () => {
        appStream.statsPanel.show();
        const statsElement = appStream.statsPanel._statsResult;
      
        if (!statsElement) {
          return {}; 
        }
      
        const statDivs = statsElement.querySelectorAll('div');
      
        if (!statDivs.length) {
          return {}; 
        }
      
        const stats = {};
      
        statDivs.forEach((div) => {
          const text = div.textContent.trim(); 
      
          
          if (text.length === 0) {
            return;
          }
      
          const [key, value] = text.split(':').map(item => item.trim());
      
    
    
          if (key && value && key.toLowerCase() !== 'players') {
            stats[key] = value;
    
            if(key == "Video resolution"){
            videoResolution =  value;
            }
    
          }
        });
      
        return stats;
      };

    appStream.stream.addEventListener('afkWarningActivate', () => postState("afkWarning"));

    appStream.showTextOverlay('Starting connection to Streampixel server, please wait');
    postState("connecting");

    appStream.onConnectAction = () => {
        appStream.showTextOverlay('Starting connection to Streampixel server, please wait');
        postState("connecting");
    };


 

 appStream.onVideoInitialized= function(){


        try {
           // appStream.stream.emitConsoleCommand('t.maxFPS 60');
           // appStream.stream.emitConsoleCommand('PixelStreaming.WebRTC.MinBitrate 1000');
        } catch (e) {
            console.warn("Console command failed:", e);
        }

      
    };

    appStream.onWebRtcConnecting = () => {
        appStream.showTextOverlay('Almost there, hold tight- awesomeness loading');
        postState("Almost there, hold tight- awesomeness loading");
    };

    appStream.onWebRtcConnected = () => {

        appStream.showTextOverlay('Sharpening pixels and buffing the details...');
        postState("finalising");

          setTimeout(()=>{
            const stats = getStats();
    
      const netRtt = stats['Net RTT (ms)'];
      const framerate = stats['Framerate'];
    
      const endTime = Date.now();

      const timeTaken = (endTime-startTime)/1000;
    
      mixpanel.track('Stream Loaded', {
        "sessionId": streamerId,
        "projectId": settings.appId,
        "projectRegion":projectData.region,
        "FPS": framerate,
        "latency": netRtt,
        "timeToLoad":timeTaken
    
    });
    
          
           },3000)
  
    };

    appStream.onWebRtcAutoConnect = () => {
        appStream.showTextOverlay('Disconnected');
        postState("disconnectd");
    };

    appStream.onWebRtcSdp = () => {
        appStream.showTextOverlay('Sharpening pixels and buffing the details...');
        postState("finalising");
    };

    const wsController = appStream.stream.signallingProtocol;

    window.addEventListener("offline", () => {
        if (wsController.isConnected()) {
            if (wsController.ws && wsController.ws.readyState === WebSocket.OPEN) {
                wsController.ws.close();
            }
            wsController.disconnect();
        }
    });

    if (wsController.isConnected()) {
        wsController.transport.on('message', (msgRaw) => {
            try {
                if (msgRaw.message === "You are in Queue") {
                    const msgFormatted = `${msgRaw.message} ${msgRaw.position}`;
                    appStream.showTextOverlay(msgFormatted);
                    postState(`queue-${msgRaw.position}`);
                    queueListeners.forEach(cb => cb(msgRaw));
                }

                if (msgRaw.message === "Application Error") {
                    document.querySelectorAll('.loading-spinner').forEach(spinner => {
                        spinner.style.display = 'none';
                    });
                    appStream.showTextOverlay(msgRaw.message);
                }
            } catch (err) {
                console.error("Message parse error:", err);
            }
        });

        wsController.transport.on('close', () => {
            appStream.showDisconnectOverlay();
        });
    }

    return {
        pixelStreaming,
        appStream,
        queueHandler,
        UIControl
    };
}else{
    return null
}
}

export { StreamPixelApplication };
