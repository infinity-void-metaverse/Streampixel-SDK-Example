import React, { useEffect, useRef } from 'react';
import { StreamPixelApplication } from 'streampixelsdk';


let PixelStreamingApp;
let PixelStreamingUiApp;


const App = () => {

  const videoRef = useRef(null);



  const startPlay = async () => {
    
    const { appStream, pixelStreaming } = StreamPixelApplication({
      AutoPlayVideo: true,
      regiom:"Europe",
      StartVideoMuted: true,
      AutoConnect: true,
      useMic: false,
      appId: "6744fb98094f3b905b08a4fa",
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

console.log(appStream);
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


   </div>

  );
};

export default App;

