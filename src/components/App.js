import React, { useEffect, useRef,useState } from 'react';
import {StreamPixelApplication} from 'streampixelsdk';


let PixelStreamingApp;
let PixelStreamingUiApp;
let UIControlApp;




const App = () => {
  const [projectId,setProjectId] = useState();
  const [sfuHost,setSfuHost] = useState("False");
  const [sfuPlayer,setSfuPlayer] = useState("False");
  const [streamerId,setStreamerId] = useState();

  const videoRef = useRef(null);

  const urlPart = window.location.href.split('/').pop();

    useEffect(() => {
    if (urlPart) {
      const urlSearchParams = new URLSearchParams(window.location.search);
    
      const baseId = urlPart.split('?')[0]; 

        setProjectId(baseId);


     for (const [key, value] of urlSearchParams.entries()) {
        if (key == 'streamerId') {
        setStreamerId(value);
       }
           if (key == 'sfuHost') {


        setSfuHost(value);
       }
           if (key == 'sfuPlayer') {


        setSfuPlayer(value);
       }
      }
      
    } else {
    }

  }, []);


  const startPlay = async () => {

    
    const { appStream, pixelStreaming, queueHandler,UIControl} = await StreamPixelApplication({
      AutoConnect: true,
      appId: projectId,
      streamerId:streamerId,
      sfuHost:sfuHost,
      sfuPlayer:sfuPlayer

    });

        
    PixelStreamingApp = pixelStreaming;
    PixelStreamingUiApp = appStream;

    UIControlApp = UIControl;
  
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
    if(projectId){
    startPlay();
    }
  },[projectId])



  
const handleResponseApp = (response) => {
 console.log(response);  
  };




 
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
  

 
</div>


  );
};

export default App;

