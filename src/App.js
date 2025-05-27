import React, { useEffect, useRef } from 'react';
import { StreamPixelApplication } from 'streampixelsdk';


let PixelStreamingApp;
let PixelStreamingUiApp;


const App = () => {

  const videoRef = useRef(null);



  const startPlay = async () => {
    
    const { appStream, pixelStreaming } = StreamPixelApplication({
      AutoPlayVideo: true,
      region:"Europe",
      StartVideoMuted: true,
      AutoConnect: true,
      useMic: false,
      appId: "68220e94fb0a65696ae613a1",
      afktimeout:250,
      touchInput:true,
      mouseInput:true,
      gamepadInput:true,
      resolution:true,
      hoverMouse:true,
      xrInput:false,
      keyBoardInput:true,
      fakeMouseWithTouches:false,
      resX:1920,
      resY:1080
    });

    

    PixelStreamingApp = pixelStreaming;
    PixelStreamingUiApp = appStream;

    appStream.onVideoInitialized = () => {
      console.log("VIDEO INITIALIZED");
    };

   videoRef.current.append(appStream.rootElement);

    const videoElement = appStream && appStream.stream.videoElementParent.querySelector("video");
    if(videoElement){
      videoElement.muted = false;
      videoElement.focus();
      videoElement.autoplay = true;
      videoElement.tabIndex = 0;
     
    }

  };


    const handleSendCommand = () => {
 
      console.log("STREAM:MESSAGESEND");
      
    PixelStreamingUiApp?.stream.emitUIInteraction({ Message: "A101" });
  };

  useEffect(()=>{
    startPlay();
  },[])

  return (
    
<div className='containMain'>
<div id="videoElement" ref={videoRef} style={{
    backgroundSize: "cover",
    height: "100vh",
    position: "relative"
  }}/>

 <button style={{position:"fixed",bottom:20,right:20,zIndex:1000000}} onClick={handleSendCommand} type="submit">Submit Message</button>

   </div>

  );
};


export default App;

