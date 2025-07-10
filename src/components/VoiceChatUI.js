import React, { useEffect, useState, useRef } from 'react';
import './VoiceChatUI.css';
import { StreamPixelVoiceChat } from 'streampixelsdk';
import EmojiPicker from 'emoji-picker-react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { FaSmile, FaPaperPlane,FaWindowClose } from 'react-icons/fa';
import { FaRegMessage } from "react-icons/fa6";


export default function VoiceChatUI({ roomName, userName, voiceChat,darkMode,position,avatar,showAudioGroup, onClose, children }) {
  const [sdk, setSdk] = useState(null);
  const [tab, setTab] = useState('text');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState({ localParticipant: '', remoteParticipants: [] });
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [showVoicePopup, setShowVoicePopup] = useState(false);
  const [muteAll, setMuteAll] = useState(false);


  const [mutedParticipants, setMutedParticipants] = useState({});
  const [localMic,setLocalMic] = useState(voiceChat);
  const inputRef = useRef(null);


  const positionStyle =
    position === "Left"?{position:"fixed",left:"20px",bottom:"12px",zIndex:"100"}:{position:"fixed",right:"20px",bottom:"12px",zIndex:"100"}
  

  const scrollRef = useRef();

  useEffect(() => {
    const chatSdk = new StreamPixelVoiceChat(roomName, userName, voiceChat,avatar);
    setSdk(chatSdk);

    const setup = async () => {
      chatSdk.onMessage((msg) => {
        const time = new Date();
        setMessages(prev => [...prev, { ...msg, time }]);
        scrollToBottom();
      });

      chatSdk.onParticipantUpdate((list) => {
        setParticipants(list);
        const muteMap = {};
        list.remoteParticipants.forEach(p => {
          muteMap[p.id] = false; 
        });
        setMutedParticipants(muteMap);
      });

      await chatSdk.join();
    };

    setup();

    return () => {
      chatSdk.leave();
    };
  }, [roomName, userName]);


    useEffect(() => {
    if (input.trim() === '' && document.activeElement === inputRef.current) {
      inputRef.current.blur();
      console.log('Input is empty, focus removed');
    }
  }, [input]);

  const sendMessage = () => {
    if (input.trim()) {
      sdk.sendMessage(input.trim());
      setInput('');
      inputRef.current.blur();

      const videoElement =  document.getElementById('videoElement');

      videoElement.focus();
    }
  };

  const muteAllRemote = async () => {
    sdk.muteAllRemote();
    const updated = {};
    participants.remoteParticipants.forEach(p => {
      updated[p.id] = true;
    });
    setMutedParticipants(updated);
    setMuteAll(true);
  };

  const unmuteAllRemote = () => {
    sdk.unmuteAllRemote();
    const updated = {};
    participants.remoteParticipants.forEach(p => {
      updated[p.id] = false;
    });
    setMutedParticipants(updated);
    setMuteAll(false);
  };

  const muteSelected = async (identity) => {

    sdk.muteSelected(identity);
    setMutedParticipants(prev => ({ ...prev, [identity]: true }));
  };

  const unmuteSelected = async (identity) => {

    sdk.unmuteSelected(identity);
    setMutedParticipants(prev => ({ ...prev, [identity]: false }));
  };

  const toggleMic = (participantId) => {

    if (participantId == userName) {
      sdk.toggleMic();
      setLocalMic(!localMic);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };



  return (

    <>
 <div className={`chat-container-wrapper ${darkMode ? 'dark-mode' : ''}`} style={positionStyle}>
    <div className="chat-container">
      
        <div className="text-tab">
          
          <div className="messages" >
            <div style={showMessageBox?{display:'block'}:{display:"none"}}>
            {messages.map((msg, index) => (
              <div key={index} className={`message-box ${msg.from === 'You' ? 'local' : 'remote'}`}>
               
                <div className="message-text">
                  
                  
                     <div className='avatar'>
                                  <div
  className="avatar img"
  dangerouslySetInnerHTML={{
    __html: `${msg.avatar}`
  }}
/>
</div>
                  
                  {msg.text}</div>
                <div className={`timestamp ${msg.from === 'You' ? 'right' : 'left'}`}>
                  {msg.from}:{msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>     </div>


          <div className="input-container">
  {showEmojiPicker && <EmojiPicker onEmojiClick={onEmojiClick} />}
  <div className="input-wrapper">
    <button className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
      <FaSmile />
    </button>
    <input
      ref={inputRef}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && sendMessage()}
      placeholder="Type a message"
    />
    {/*
    <button className="send-btn" onClick={sendMessage}>
      <FaPaperPlane />
    </button>
    */}
      <button className="send-btn" onClick={()=>setShowMessageBox(!showMessageBox)}>
      <FaRegMessage />
    </button>
  </div>
</div>
        </div>
</div>


</div>

    {showAudioGroup && (   
      
       <div style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: darkMode ? '#1e1e1e' : '#fff',
    border: '1px solid #ccc',
    borderRadius: '12px',
    padding: '20px',
    zIndex: 9999,
    width: '60%',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
  }}>
    <button
      style={{
        float: 'right',
        background: 'transparent',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        color: darkMode ? '#fff' : '#333',
      }}
       onClick={onClose}
    >
      <FaWindowClose size={32}/>
    </button>
<div className="voice-tab">

<p style={{textAlign:"center",fontSize:"18px",fontWeight:"bold"}}>Audio Groups</p>

  <div className="participant-grid">
    {participants.localParticipant && (
      <div className="participant">
        <div className="avatar">
          <div
            className="avatar img"
            dangerouslySetInnerHTML={{
              __html: `${participants.localParticipant.avatar}`,
            }}
          />
        </div>
        <span className="name">{participants.localParticipant.id} (You)</span>
        <button onClick={() => toggleMic(participants.localParticipant.id)}>
          {localMic ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        {participants.localParticipant.speaking && (
          <div className="speaking-indicator" />
        )}
      </div>
    )}

    {participants.remoteParticipants.map((p, idx) => (
      <div key={idx} className="participant">
        <div className="avatar">
          <div
            className="avatar img"
            dangerouslySetInnerHTML={{
              __html: `${p.avatar}`,
            }}
          />
        </div>
        <span className="name">{p.id}</span>
        <button
          onClick={() =>
            mutedParticipants[p.id] ? unmuteSelected(p.id) : muteSelected(p.id)
          }
        >
          {mutedParticipants[p.id] ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        {p.speaking && <div className="speaking-indicator" />}
      </div>
    ))}
  </div>

    <div className="voice-controls">
   {muteAll?(<button onClick={unmuteAllRemote}>UnMute All</button>):(<button onClick={muteAllRemote}>Mute All</button>)} 
    
  </div>

</div>
        </div>)}
     
<div style={{
    position: "fixed",
    bottom: 20,
    right: 820,
    zIndex: 10000000,
    display: "flex",
    flexDirection: "row",
    gap: "10px"
  }}>

        
    <button onClick={() => setShowVoicePopup(!showVoicePopup)}>
      VoiceGroup
    </button>
    </div>
    </>
  );
}
