import React, { useEffect, useRef,useState } from 'react';
import { StreamPixelApplication } from 'streampixelsdk';


let PixelStreamingApp;
let PixelStreamingUiApp;
let UIControlApp;


const App = () => {

  const videoRef = useRef(null);

 

  const startPlay = async () => {
    
    const { appStream, pixelStreaming, queueHandler,UIControl} = await StreamPixelApplication({
      AutoConnect: true,
      appId: "66987bef00e9a75f67b622e4",
      resX:1920,
      resY:1080,
      showUI:true
    });

    

    PixelStreamingApp = pixelStreaming;
    PixelStreamingUiApp = appStream;

    UIControlApp = UIControl;


    appStream.onVideoInitialized = () => {
      videoRef.current.append(appStream.rootElement);

    };

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
  const getStats = () => {
    
    const stats = UIControlApp.getStreamStats();
    console.log(stats);

  }



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

  <div style={{
    position: "fixed",
    bottom: 20,
    right: 20,
    zIndex: 10000000,
    display: "flex",
    flexDirection: "row",
    gap: "10px"
  }}>
    <button onClick={() => getStats()}>Stats</button>
    <button onClick={() => handleMicrophone()}>Mic</button>
    <button onClick={() => handleRes('854x480')}>Resolution</button>
    <button onClick={() => toggleSound()}>Toggle Sound</button>
  </div>
</div>


  );
};

export default App;

