import React, { useState } from 'react';
import { Send } from 'lucide-react';

const AnonymousChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(3); // Placeholder count

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'me', text: input.trim() }]);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

        {/* Online Users */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '16px', fontWeight: '500', color: '#4b5563' }}>
          Online Users: {onlineUsers}
        </div>

        <hr style={{ margin: '12px 0', borderColor: '#e5e7eb' }} />

        {/* Intro Text */}
        <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: '600', color: '#4c1d95', marginBottom: '16px' }}>
          You are chatting with a stranger. Happy chatting!
        </div>

        {/* Chat Messages */}
        <div style={{ height: '400px', overflowY: 'auto', marginBottom: '16px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf: msg.sender === 'me' ? 'flex-start' : 'flex-end',
                backgroundColor: msg.sender === 'me' ? '#dcfce7' : '#ddd6fe',
                color: msg.sender === 'me' ? '#166534' : '#5b21b6',
                padding: '10px 16px',
                borderRadius: '16px',
                maxWidth: '75%',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '16px',
              backgroundColor: '#f9fafb',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#7c3aed';
              e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={handleSend}
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              opacity: input.trim() ? 1 : 0.6
            }}
            disabled={!input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnonymousChat;  