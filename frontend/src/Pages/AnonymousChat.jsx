import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useFirebase } from '../Firebase/Firebase'; // Adjust path as needed
import axios from 'axios';

const AnonymousChat = () => {
  const location = useLocation();
  const interests = location.state?.interests || [];
  const { sendAnonymousMessage, listenToAnonymousMessages } = useFirebase();

  const [matchId, setMatchId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // Find match on component mount
  useEffect(() => {
    const findMatch = async () => {
      try {
        setConnectionStatus('Finding a match...');
        const res = await axios.post('http://127.0.0.1:5000/process_match', {
          interest: interests // Note: your backend expects 'interest' not 'interests'
        });
        
        if (res.data.match_id) {
          setMatchId(res.data.match_id);
          setConnectionStatus('Connected to stranger');
          console.log('Matched with ID:', res.data.match_id);
        } 
        else if (res.data.status === 'waiting_for_match') {
          setConnectionStatus('Waiting for someone to join...');
          // Keep checking for matches every 5 seconds
          const interval = setInterval(async () => {
            try {
              const checkRes = await axios.post('http://127.0.0.1:5000/process_match', {
                interest: interests
              });
              if (checkRes.data.match_id) {
                setMatchId(checkRes.data.match_id);
                setConnectionStatus('Connected to stranger');
                clearInterval(interval);
              }
            } 
            catch (err) {
              console.error('Error checking for match:', err);
            }
          }, 5000);
          
          return () => clearInterval(interval);
        }
        setLoading(false);
      } 
      catch (error) {
        console.error('Matchmaking error:', error);
        setError('Could not find a match. Please try again.');
        setConnectionStatus('Connection failed');
        setLoading(false);
      }
    };

    findMatch();
  }, [interests]);

  // Listen to messages when matchId is available
  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = listenToAnonymousMessages(matchId, (messageList) => {
      setMessages(messageList.map(msg => ({
        id: msg.id,
        text: msg.message,
        sender: msg.isAnonymous ? 'stranger' : 'me',
        timestamp: msg.timeStamp
      })));
    });

    return unsubscribe;
  }, [matchId, listenToAnonymousMessages]);

  // Fetch online users count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:5000/waiting_users');
        setOnlineUsers(res.data.waiting_users_count);
      } catch (error) {
        console.error('Error fetching user count:', error);
      }
    };

    fetchCount();
    // Update count every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clean up match on component unmount
  useEffect(() => {
    return () => {
      if (matchId) {
        axios.post('http://127.0.0.1:5000/end_match', { match_id: matchId })
          .catch(err => console.error('Error ending match:', err));
      }
    };
  }, [matchId]);

  const handleSend = async () => {
    if (!input.trim() || !matchId) return;

    // Add message to local state immediately for better UX
      const tempMessage = {
        id: Date.now(), // temporary id
        text: input.trim(),
        sender: 'me',
        timestamp: Date.now()
      };
    try {
      
      setMessages(prev => [...prev, tempMessage]);

      // Send to Firebase
      await sendAnonymousMessage(matchId, input.trim());
      setInput('');
    } 
    catch (error) {
      console.error('Error sending message:', error);
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '48px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#4c1d95', marginBottom: '16px' }}>
            {connectionStatus}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Please wait while we find someone with similar interests...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '48px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626', marginBottom: '16px' }}>
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

        {/* Header with online users and connection status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: matchId ? '#059669' : '#f59e0b' }}>
            {connectionStatus}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563' }}>
            Online Users: {onlineUsers}
          </div>
        </div>

        <hr style={{ margin: '12px 0', borderColor: '#e5e7eb' }} />

        {/* Intro Text */}
        <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: '600', color: '#4c1d95', marginBottom: '16px' }}>
          {matchId ? 'You are chatting with a stranger. Happy chatting!' : 'Waiting for someone to join...'}
        </div>

        {/* Chat Messages */}
        <div style={{ 
          height: '400px', 
          overflowY: 'auto', 
          marginBottom: '16px', 
          padding: '8px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px'
        }}>
          {messages.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              {matchId ? 'Start the conversation...' : 'Waiting for match...'}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'me' ? '#dcfce7' : '#ddd6fe',
                  color: msg.sender === 'me' ? '#166534' : '#5b21b6',
                  padding: '10px 16px',
                  borderRadius: '16px',
                  maxWidth: '75%',
                  fontSize: '15px',
                  fontWeight: '500',
                  wordBreak: 'break-word'
                }}
              >
                {msg.text}
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={matchId ? "Type your message..." : "Waiting for match..."}
            disabled={!matchId}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '16px',
              backgroundColor: matchId ? '#f9fafb' : '#f3f4f6',
              outline: 'none',
              opacity: matchId ? 1 : 0.6
            }}
            onFocus={(e) => {
              if (matchId) {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
              }
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
              cursor: (input.trim() && matchId) ? 'pointer' : 'not-allowed',
              opacity: (input.trim() && matchId) ? 1 : 0.6
            }}
            disabled={!input.trim() || !matchId}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '12px', color: '#0369a1' }}>
          <strong>Your interests:</strong> {interests.join(', ')}
        </div>
      </div>
    </div>
  );
};

export default AnonymousChat;