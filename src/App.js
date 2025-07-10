import React, { useEffect, useRef,useState } from 'react';
import {StreamPixelApplication} from 'streampixelsdk';
import VoiceChatUI from './components/VoiceChatUI';
import {NameForgeJS} from 'nameforgejs';
import { createAvatar } from '@dicebear/core';
import { personas } from '@dicebear/collection';

let PixelStreamingApp;
let PixelStreamingUiApp;
let UIControlApp;
const nameGenerator = new NameForgeJS();

const App = () => {

  const videoRef = useRef(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showAudioGroup, setShowAudioGroup] = useState(false);

  const openAudioGroup = () => {
    setShowAudioGroup(true);
  };

  const closeAudioGroup = () => {
    setShowAudioGroup(false);
  };
 

  const startPlay = async () => {
    
    const { appStream, pixelStreaming, queueHandler,UIControl} = await StreamPixelApplication({
      AutoConnect: true,
      appId: "66987bef00e9a75f67b622e4",
     // useMic: true,                              true|false
     // primaryCodec:"AV1",                        'AV1|H264|VP9|VP8'
     // fallBackCodec:"H264",                      'AV1|H264|VP9|VP8'
      //afktimeout:5000,                           'Min. 1 Max 7200 Seconds'
     // touchInput:true,                           true|false
     // mouseInput:true,                           true|false
     // gamepadInput:false,                        true|false
     // hoverMouse:true,                           true|false
     // xrInput:false,                             true|false
     //showResolution:true                         true|false
     // keyBoardInput:true,                        true|false
    //  fakeMouseWithTouches:false,                true|false
   //   maxStreamQuality:'720p (1280x720)',        [  "360p (640x360)","480p (854x480)","720p (1280x720)","1080p (1920x1080)","1440p (2560x1440)","4K (3840x2160)"]
   //   startResolutionMobile:'480p (854x480)',
   //   startResolutionTab:'1080p (1920x1080)',
   //   startResolution:"720p (1280x720)",
   //   resolutionMode:"Fixed Resolution Mode"     ["Fixed Resolution Mode"|| "Crop on Resize Mode" || "Dynamic Resolution Mode"]
   //minBitrate:1
   //maxBitrate:100
   //maxQP:-1
   //minQP:20
    });

    

    
    PixelStreamingApp = pixelStreaming;
    PixelStreamingUiApp = appStream;

    UIControlApp = UIControl;

        appStream.onConnectAction = function() {
          console.log("Starting connection to Streampixel server, please wait");
    }

        appStream.onWebRtcConnecting = function() {
          console.log("Almost there, hold tight- awesomeness loading");
    }
            appStream.onWebRtcConnected = function() {
          console.log("Sharpening pixels and buffing the details...");
    }


    appStream.onVideoInitialized = () => {
      videoRef.current.append(appStream.rootElement);

    };

     appStream.onDisconnect = function() {
          console.log("Disconnectd");
    }

    

    queueHandler((msg) => {
      console.log("User is in queue at position:", msg.position);
     
  });


    PixelStreamingApp.addResponseEventListener('handle_responses', handleResponseApp);



    const videoElement = appStream && appStream.stream.videoElementParent.querySelector("video");
    if(videoElement){
      videoElement.muted = false;
      videoElement.focus();
      videoElement.autoplay = true;
      videoElement.tabIndex = 0;
     
    }

  };

  useEffect(()=>{
    //startPlay();
  },[])



  
  const handleResponseApp = (response) => {
 console.log(response);  
  };


  const handleTerminateSession = () => {
    PixelStreamingApp.disconnect();
    PixelStreamingUiApp?.stream.disconnect();
  };

  const handleSendCommand = (descriptor) => {
 // descriptor = { message: {value:'480p (854x480)',type:"setResolution"} };
    PixelStreamingUiApp?.stream.emitUIInteraction(descriptor);
  };



  const toggleSound = () => {

    if(UIControlApp){
      UIControlApp.toggleAudio();
    }
      
  }   


    const handleRes = (value) => {

    if(UIControlApp){
      UIControlApp.handleResMax(value);
    }

  }  
  const getStats = async() => {

    //const stats = UIControlApp.getStreamStats();
   // console.log("stats:",stats);

  
    }


    const getResolutionOptions = async() =>{


   // const resolutionSettings  = UIControlApp.getResolution();
   // console.log("resolutionSettings:",resolutionSettings);

    }


const userName = nameGenerator.generateNames({
  name_type: 'human',
  count: 1,
  generate_last_name: false,
  country: 'any'
});


const avatar = createAvatar(personas, {
  seed: userName,
  size: 32,
}).toString();


  const handleMicrophone =async()=>{
    
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          PixelStreamingApp.unmuteMicrophone(true);
        } catch (err) {
          console.error('Microphone access denied', err);
        }

    }

        

  return (
    
<div className='containMain'>
  
<div
    id="videoElement"
    ref={videoRef}
    style={{
      backgroundSize: "cover",
      height: "100vh",
      position: "relative"
    }}
  />
  
  <VoiceChatUI roomName="TESTROOM" userName={userName} voiceChat={true} darkMode={darkMode}  position="Left" avatar={avatar} showAudioGroup={showAudioGroup} onClose={closeAudioGroup}/>

  <div style={{
    position: "fixed",
    bottom: 20,
    right: 20,
    zIndex: 10000000,
    display: "flex",
    flexDirection: "row",
    gap: "10px"
  }}>

        
    <button onClick={() => setDarkMode(!darkMode)}>
      Toggle {darkMode ? 'Light' : 'Dark'} Mode
    </button>
     <button
        onClick={openAudioGroup}
         >
       Show Audio Group
      </button>
  
    <button onClick={() => getStats()}>Stats</button>
    <button onClick={() => getResolutionOptions()}>Resolution Options</button>

    <button onClick={() => handleMicrophone()}>Mic</button>
    <button onClick={() => handleRes('1280x720')}>Resolution</button>
    <button onClick={() => toggleSound()}>Toggle Sound</button>
  </div>
</div>


  );
};

export default App;

