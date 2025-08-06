import React, { useEffect, useRef,useState } from 'react';
import {StreamPixelApplication} from 'streampixelsdk';
import VoiceChatUI from './components/VoiceChatUI';
import { createAvatar } from '@dicebear/core';
import { personas } from '@dicebear/collection';

let PixelStreamingApp;
let PixelStreamingUiApp;
let UIControlApp;


function isMobilePhone() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iphone|blackberry|iemobile|opera mini/i.test(ua)
    && !/ipad|ipod/i.test(ua);
}

let isMobile = isMobilePhone();

function generateRandomName() {
  const nouns = [
    "Neon", "Silent", "Ghostly", "Turbo", "Infinite", "Crimson", "Phantom", "Electric", "Quantum", "Radiant",
    "Glitchy", "Shiny", "Hidden", "Frozen", "Vivid", "Shadow", "Velvet", "Chrome", "Virtual", "Floating"
  ];

  const adjectives = [
    "Pixel", "Architect", "Streamer", "Prism", "Sprite", "Phantom", "Composer", "Painter", "Shader",
    "Operator", "Lancer", "Visionary", "Cycler", "Mirage", "Voxel", "Sculptor", "Animator", "Seeker", "Renderer", "Engineer"
  ];

  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomId = Math.floor(1000 + Math.random() * 9000); 

  return `${randomNoun} ${randomAdjective}#${randomId}`;

 //return generatedNames;
}


//const nameGenerator = new NameForgeJS();

const App = () => {

  const videoRef = useRef(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showAudioGroup, setShowAudioGroup] = useState(false);

  const [roomDisconnect, setRoomDisconnect] = useState(false);

  const [toggleMicChat, setToogleMicChat] = useState(false);
  const [sdkConnect, setSdkConnect] = useState(false);
  const [newMessage, setNewMessage] = useState(0);

  const [roomConnect, setRoomConnect] = useState(true);

    const [showChatUiMobile, setShowChatUiMobile] = useState(!isMobile);

  const openAudioGroup = () => {
    setShowAudioGroup(true);
  };

  const closeAudioGroup = () => {
    setShowAudioGroup(false);
  };


    const openChatUiMobile = () => {
    setShowChatUiMobile(true);
  };

  const closeChatUiMobile = () => {
    setShowChatUiMobile(false);
  };
 
  const handleMicChat = () => {
    setToogleMicChat(!toggleMicChat);
  };
 




 

  const startPlay = async () => {
    
    const { appStream, pixelStreaming, queueHandler,UIControl} = await StreamPixelApplication({
      AutoConnect: true,
      appId: "679d8cb5326a62020e8738d5",
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
    startPlay();
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

    const enableMouseHover = ()=>{


    if(UIControlApp){
     UIControlApp && UIControlApp.toggleHoveringMouse(true);
    }
    }

    const disableMouseHover = ()=>{

  if(UIControlApp){
           UIControlApp && UIControlApp.toggleHoveringMouse(false);
  }

    }


    const getResolutionOptions = async() =>{


   // const resolutionSettings  = UIControlApp.getResolution();
   // console.log("resolutionSettings:",resolutionSettings);

    }


const userName = generateRandomName();



const handleMessageNumber =(messageLen)=>{

setNewMessage(messageLen);

}

const handleRoomConnect =(value)=>{

if(value == true){
  setSdkConnect(true);
}
}


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
  
  <VoiceChatUI roomConnect={roomConnect} roomDisconnect={roomDisconnect}  toggleMicChat={toggleMicChat} handleMessageNumber={handleMessageNumber} handleRoomConnect={handleRoomConnect}  darkMode={darkMode} micStart={true} roomName="TESTSDKROOM" showChatUiMobile ={showChatUiMobile} userName={userName} voiceChat={true} textChat={true} position="Left" avatar={avatar} showAudioGroup={showAudioGroup} onClose={closeAudioGroup}  onCloseChatUi={closeChatUiMobile}/>

  <div style={{
    position: "fixed",
    bottom: 20,
    right: 20,
    zIndex: 10000000,
    display: "flex",
    flexDirection: "row",
    gap: "10px"
  }}>

        
   
  

      <button onClick={() => enableMouseHover()}>ENable Mouse Hover</button>
        <button onClick={() => disableMouseHover()}>Disable Mouse Hover</button>
{/*

 <button onClick={() => setDarkMode(!darkMode)}>
      Toggle {darkMode ? 'Light' : 'Dark'} Mode
    </button>
     <button
        onClick={openAudioGroup}
         >
       Show Audio Group
      </button>
    <button onClick={() => getResolutionOptions()}>Resolution Options</button>
    <button onClick={() => getStats()}>Stats</button>

    <button onClick={() => handleMicrophone()}>Mic</button>
    <button onClick={() => handleRes('1280x720')}>Resolution</button>
    <button onClick={() => toggleSound()}>Toggle Sound</button>

    */}
  </div>
</div>


  );
};

export default App;

