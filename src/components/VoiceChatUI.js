import React, { useEffect, useState, useRef } from 'react';
import './VoiceChatUI.css';
import { StreamPixelVoiceChat } from 'streampixelsdk'; // Adjust path if needed


export default function VoiceChatUI({ roomName, userName,voiceChat }) {
  const [sdk, setSdk] = useState(null);
  const [tab, setTab] = useState('text');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState({ localParticipant: '', remoteParticipants: [] });
  const [input, setInput] = useState('');
  const scrollRef = useRef();


  useEffect(() => {

    console.log("USERNAME:",userName);
    const chatSdk = new StreamPixelVoiceChat(roomName, userName ,voiceChat);
    setSdk(chatSdk);

    const setup = async () => {
      chatSdk.onMessage((msg) => {
        const time = new Date();
        setMessages(prev => [...prev, { ...msg, time }]);
        scrollToBottom();
      });

      chatSdk.onParticipantUpdate((list) => {

console.log("LIST:",list);
        setParticipants(list);
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

  const toggleMic = (participantId) => {
    if (participantId === 'You' || participantId === userName) {
      sdk.toggleMic();
    } else {
      // Optional: implement admin control to mute remote
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
    



  return (
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
                <div className="timestamp">
                  {msg.time.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
          <div className="input-box">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message"
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}

      {tab === 'voice' && (
        <div className="voice-tab">
          <div className="participant-list">
            {participants.localParticipant && (
              <div className="participant">
                <span className="name">{participants.localParticipant} (You)</span>
                <button onClick={() => toggleMic(participants.localParticipant)}>🎤 Toggle Mic</button>
                <div className="speaking-indicator" />
              </div>
            )}
            {participants.remoteParticipants.map((p, idx) => (
              <div key={idx} className="participant">
                <span className="name">{p}</span>
                <button onClick={() => toggleMic(p)}>🎤 Toggle Mic</button>
                <div className="speaking-indicator" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
