import React, { useEffect, useState, useRef } from 'react';
import './VoiceChatUI.css';
import { StreamPixelVoiceChat } from 'streampixelsdk';
import EmojiPicker from 'emoji-picker-react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { FaSmile, FaPaperPlane} from 'react-icons/fa';


export default function VoiceChatUI({ roomName, userName, voiceChat,darkMode }) {
  const [sdk, setSdk] = useState(null);
  const [tab, setTab] = useState('text');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState({ localParticipant: '', remoteParticipants: [] });
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mutedParticipants, setMutedParticipants] = useState({});

  const scrollRef = useRef();

  useEffect(() => {
    const chatSdk = new StreamPixelVoiceChat(roomName, userName, voiceChat);
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
          muteMap[p] = false; // default to unmuted
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

  const sendMessage = () => {
    if (input.trim()) {
      sdk.sendMessage(input.trim());
      setInput('');
    }
  };

  const muteAllRemote = async () => {
    sdk.muteAllRemote();
    const updated = {};
    participants.remoteParticipants.forEach(p => {
      updated[p] = true;
    });
    setMutedParticipants(updated);
  };

  const unmuteAllRemote = () => {
    sdk.unmuteAllRemote();
    const updated = {};
    participants.remoteParticipants.forEach(p => {
      updated[p] = false;
    });
    setMutedParticipants(updated);
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
    if (participantId === 'You' || participantId === userName) {
      sdk.toggleMic();
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


 <div className={`chat-container-wrapper ${darkMode ? 'dark-mode' : ''}`}>
    <div className="chat-container">
      <div className="tab-buttons">
        <button onClick={() => setTab('voice')} className={tab === 'voice' ? 'active' : ''}>Voice</button>
        <button onClick={() => setTab('text')} className={tab === 'text' ? 'active' : ''}>Text</button>
      </div>

      {tab === 'text' && (
        <div className="text-tab">
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message-box ${msg.from === 'You' ? 'local' : 'remote'}`}>
                <div className="message-text">{msg.text}</div>
                <div className={`timestamp ${msg.from === 'You' ? 'right' : 'left'}`}>
                  {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          <div className="input-container">
  {showEmojiPicker && <EmojiPicker onEmojiClick={onEmojiClick} />}
  <div className="input-wrapper">
    <button className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
      <FaSmile />
    </button>
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && sendMessage()}
      placeholder="Type a message"
    />
    <button className="send-btn" onClick={sendMessage}>
      <FaPaperPlane />
    </button>
  </div>
</div>
        </div>
      )}

      {tab === 'voice' && (
        <div className="voice-tab">
          <div className="voice-controls">
            <button onClick={muteAllRemote}>Mute All</button>
            <button onClick={unmuteAllRemote}>Unmute All</button>
          </div>

          <div className="participant-list">
            {participants.localParticipant && (
              <div className="participant">
                <span className="name">{participants.localParticipant} (You)</span>
                <button onClick={() => toggleMic(participants.localParticipant)}>
                  <FaMicrophone />
                </button>
                <div className="speaking-indicator" />
              </div>
            )}

            {participants.remoteParticipants.map((p, idx) => (
              <div key={idx} className="participant">
                <span className="name">{p}</span>
                <button onClick={() =>
                  mutedParticipants[p] ? unmuteSelected(p) : muteSelected(p)
                }>
                  {mutedParticipants[p] ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>
                <div className="speaking-indicator" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
    </>
  );
}
