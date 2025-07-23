import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Send, XCircle, Play } from 'lucide-react'; // Added XCircle and Play for buttons
import { useLocation } from 'react-router-dom';
import { useFirebase } from '../Firebase/Firebase'; // Adjust path as needed
import axios from 'axios';

const AnonymousChat = () => {
    const location = useLocation();
    const interests = location.state?.interests || [];
    // Ensure useFirebase provides sendAnonymousMessage and listenToAnonymousMessages.
    // The 'user' object from useFirebase is for authenticated users and not strictly needed for anonymous chat.
    const { sendAnonymousMessage, listenToAnonymousMessages } = useFirebase();

    // --- User Session ID (Persistent for the browser session) ---
    // This will be used as the 'anonymousUserId' for the current user in chat
    const userSessionIdRef = useRef(localStorage.getItem("anon_user_id"));
    if (!userSessionIdRef.current) {
        userSessionIdRef.current = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        localStorage.setItem("anon_user_id", userSessionIdRef.current);
    }

    // --- Anonymous Display Name (Persistent for the browser session) ---
    // This will be the name shown for the current user in anonymous chat
    const [myAnonymousDisplayName, setMyAnonymousDisplayName] = useState(() => {
        const storedDisplayName = localStorage.getItem("anon_display_name");
        if (storedDisplayName) {
            return storedDisplayName;
        } else {
            const newDisplayName = `Guest ${Math.floor(Math.random() * 900) + 100}`; // Generates a number between 100 and 999
            localStorage.setItem("anon_display_name", newDisplayName);
            return newDisplayName;
        }
    });

    // --- Component State ---
    const [matchId, setMatchId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [input, setInput] = useState('');
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    const [isSearching, setIsSearching] = useState(false); // Controls if matchmaking is active
    const [chatActive, setChatActive] = useState(false); // Controls if a chat session is established

    const messagesEndRef = useRef(null);
    const pollingIntervalRef = useRef(null); // Ref to store interval ID for cleanup
    const messageListenerRef = useRef(null); // Ref to store message listener cleanup function

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- Matchmaking Logic (Encapsulated and Controlled) ---
    const startMatchmaking = useCallback(async () => {
        // Prevent starting multiple searches or searching if already matched
        if (isSearching || chatActive) {
            console.log("Already searching or chat active, skipping new matchmaking attempt.");
            return;
        }

        setIsSearching(true);
        setLoading(true);
        setError(null);
        setConnectionStatus('Finding a match...');
        setMessages([]); // Clear messages when starting a new search

        // Clear any existing polling interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        // Clear any existing message listener
        if (messageListenerRef.current) {
            messageListenerRef.current();
            messageListenerRef.current = null;
        }

        try {
            console.log(`Attempting initial match for user: ${userSessionIdRef.current} with interests: ${interests.join(', ')}`);
            const res = await axios.post('http://127.0.0.1:5000/process_match', {
                interests: interests,
                user_id: userSessionIdRef.current
            });

            if (res.data.status === 'match_found' && res.data.match_id) {
                setMatchId(res.data.match_id);
                setChatActive(true); // Chat is now active
                setConnectionStatus('Connected to stranger');
                setIsSearching(false);
                setLoading(false);
                console.log('Matched with ID:', res.data.match_id);
                if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); // Clear interval if match found
                return;
            } else if (res.data.status === 'waiting_for_match') {
                setConnectionStatus('Waiting for someone to join...');
                setLoading(false);
                console.log('No immediate match, starting poll.');

                // Start polling
                pollingIntervalRef.current = setInterval(async () => {
                    try {
                        console.log(`Polling for match for user: ${userSessionIdRef.current}`);
                        const checkRes = await axios.post('http://127.0.0.1:5000/process_match', {
                            interests: interests,
                            user_id: userSessionIdRef.current
                        });
                        if (checkRes.data.status === 'match_found' && checkRes.data.match_id) {
                            setMatchId(checkRes.data.match_id);
                            setChatActive(true); // Chat is now active
                            setConnectionStatus('Connected to stranger');
                            setIsSearching(false);
                            setLoading(false);
                            console.log('Match found via polling:', checkRes.data.match_id);
                            if (pollingIntervalRef.current) {
                                clearInterval(pollingIntervalRef.current); // Clear interval
                                pollingIntervalRef.current = null;
                            }
                        } else {
                            console.log('Still waiting for match...');
                        }
                    } catch (pollErr) {
                        console.error('Error while polling for match:', pollErr);
                        // Consider setting an error state if polling consistently fails
                    }
                }, 5000); // Poll every 5 seconds
            } else {
                // Unexpected status from backend
                setError(res.data.message || 'An unexpected error occurred during matchmaking.');
                setConnectionStatus('Matchmaking failed.');
                setIsSearching(false);
                setLoading(false);
            }
        } catch (error) {
            console.error('Matchmaking error:', error);
            setError('Could not find a match. Please try again.');
            setConnectionStatus('Connection failed');
            setIsSearching(false);
            setLoading(false);
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        }
    }, [interests, isSearching, chatActive]); // Dependencies for useCallback

    // Effect to trigger matchmaking when component mounts or when explicitly requested
    useEffect(() => {
        // Only start matchmaking if no chat is active and not already searching
        if (!chatActive && !isSearching) {
            startMatchmaking();
        }

        // Cleanup interval on unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            if (messageListenerRef.current) {
                messageListenerRef.current();
                messageListenerRef.current = null;
            }
        };
    }, [chatActive, isSearching, startMatchmaking]); // Dependencies for useEffect

    // Listen to messages when matchId is available
    useEffect(() => {
        if (!matchId) {
            setMessages([]); // Clear messages if no matchId
            if (messageListenerRef.current) {
                messageListenerRef.current();
                messageListenerRef.current = null;
            }
            return;
        }

        console.log(`Listening to messages for match ID: ${matchId}`);
        
        // Clear any existing listener before setting up a new one
        if (messageListenerRef.current) {
            messageListenerRef.current();
            messageListenerRef.current = null;
        }

        const unsubscribe = listenToAnonymousMessages(matchId, (messageList) => {
            console.log("Received message list from Firebase:", messageList);
            setMessages(messageList.map(msg => {
                // IMPORTANT: Console log raw message from Firebase to debug reception
                console.log("Raw message from Firebase:", msg); 

                const senderType = msg.anonymousUserId === userSessionIdRef.current ? 'me' : 'stranger';
                return {
                    id: msg.id,
                    text: msg.message,
                    sender: senderType,
                    timestamp: msg.timeStamp,
                    anonymousDisplayName: msg.anonymousDisplayName // Keep the display name for rendering
                };
            }));
        });

        // Store the unsubscribe function
        messageListenerRef.current = unsubscribe;

        return () => {
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [matchId, listenToAnonymousMessages]);

    // Fetch online users count
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await axios.get('http://127.0.0.1:5000/waiting_users');
                setOnlineUsers(res.data.waiting_users_count);
            }
            catch (error) {
                console.error('Error fetching user count:', error);
            }
        };

        fetchCount();
        // Update count every 30 seconds
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // --- Handle Sending Messages ---
    const handleSend = async () => {
        if (!input.trim() || !matchId || !userSessionIdRef.current || !myAnonymousDisplayName) {
            console.log("Cannot send message - missing required data:", {
                input: input.trim(),
                matchId,
                userId: userSessionIdRef.current,
                displayName: myAnonymousDisplayName
            });
            return;
        }

        const messageText = input.trim();
        setInput(''); // Clear input immediately

        try {
            // IMPORTANT: Console log data being sent to Firebase
            console.log("Attempting to send message to Firebase:", {
                matchId: matchId,
                message: messageText,
                anonymousUserId: userSessionIdRef.current,
                anonymousDisplayName: myAnonymousDisplayName
            });
            
            await sendAnonymousMessage(
                matchId,
                messageText,
                userSessionIdRef.current, // Pass the current user's session ID as anonymousUserId
                myAnonymousDisplayName // Pass the current user's anonymous display name
            );
            
            console.log("Message sent successfully to Firebase");
        }
        catch (error) {
            console.error('Error sending message:', error);
            // Optionally, show an error message to the user
            setError('Failed to send message. Please try again.');
            setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // --- Handle Ending Chat ---
    const handleEndChat = async () => {
        if (!matchId) return; // Only end if there's an active match

        setLoading(true); // Show loading state briefly
        setConnectionStatus('Ending chat...');
        
        // Stop polling immediately
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        // Stop listening to messages
        if (messageListenerRef.current) {
            messageListenerRef.current();
            messageListenerRef.current = null;
        }

        try {
            console.log(`Ending match ${matchId} for user ${userSessionIdRef.current}`);
            await axios.post('http://127.0.0.1:5000/end_match', {
                match_id: matchId,
                user_id: userSessionIdRef.current // Important: Tell backend which user is ending
            });
            console.log('Match end request sent successfully.');

            // Reset state to allow starting a new match manually
            setMatchId(null);
            setMessages([]);
            setChatActive(false); // Chat is no longer active
            setIsSearching(false); // Not searching
            setLoading(false); // Hide loading indicator
            setConnectionStatus('Chat ended. Click "Start New Chat" to find another stranger.');
        } catch (err) {
            console.error('Error ending match:', err);
            setError('Failed to end chat. Please try refreshing.');
            setConnectionStatus('Error ending chat.');
            setLoading(false);
            setIsSearching(false); // Ensure search can be re-attempted
        }
    };

    // --- Handle Starting New Chat ---
    const handleStartNewChat = () => {
        // Clear any existing state
        setError(null);
        setChatActive(false); // Ensure chatActive is false before searching
        setMatchId(null); // Clear previous match ID
        setMessages([]); // Clear messages from previous chat
        setConnectionStatus('Starting new search...');
        
        // Clear any existing listeners
        if (messageListenerRef.current) {
            messageListenerRef.current();
            messageListenerRef.current = null;
        }
        
        startMatchmaking(); // Initiate a new matchmaking process
    };

    // --- Cleanup match on component unmount ---
    useEffect(() => {
        return () => {
            // Only end match if there's an active match when component unmounts
            if (matchId && userSessionIdRef.current) {
                // Use a direct axios call as component is unmounting, no need for state updates
                axios.post('http://127.0.0.1:5000/end_match', {
                    match_id: matchId,
                    user_id: userSessionIdRef.current
                })
                    .then(() => console.log('Match ended on unmount.'))
                    .catch(err => console.error('Error ending match on unmount:', err));
            }
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            if (messageListenerRef.current) {
                messageListenerRef.current();
                messageListenerRef.current = null;
            }
        };
    }, [matchId]); // Depend on matchId so this effect re-runs if matchId changes

    // --- Render Logic ---
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

    if (error && !chatActive && !isSearching) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '48px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626', marginBottom: '16px' }}>
                        {error}
                    </div>
                    <button
                        onClick={handleStartNewChat}
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
                    <div style={{ fontSize: '14px', fontWeight: '500', color: chatActive ? '#059669' : '#f59e0b' }}>
                        {connectionStatus}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563' }}>
                        Online Users: {onlineUsers}
                    </div>
                </div>

                {/* Error display for chat errors */}
                {error && (chatActive || isSearching) && (
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '14px', color: '#dc2626' }}>
                            {error}
                        </div>
                    </div>
                )}

                <hr style={{ margin: '12px 0', borderColor: '#e5e7eb' }} />

                {/* Intro Text / Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: '600', color: '#4c1d95', flexGrow: 1 }}>
                        {chatActive ? `You are chatting with a stranger (${myAnonymousDisplayName}). Happy chatting!` : connectionStatus}
                    </div>
                    {chatActive && (
                        <button
                            onClick={handleEndChat}
                            style={{
                                backgroundColor: '#ef4444', // Red color for end chat
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginLeft: '10px' // Add some space
                            }}
                        >
                            <XCircle size={16} /> End Chat
                        </button>
                    )}
                    {!chatActive && !isSearching && ( // Show Start New Chat only if not active and not searching
                        <button
                            onClick={handleStartNewChat}
                            style={{
                                backgroundColor: '#3b82f6', // Blue color for start new chat
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginLeft: '10px' // Add some space
                            }}
                        >
                            <Play size={16} /> Start New Chat
                        </button>
                    )}
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
                    {messages.length === 0 && !chatActive ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#6b7280',
                            fontStyle: 'italic'
                        }}>
                            {isSearching ? 'Waiting for a match...' : 'Click "Start New Chat" to begin!'}
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
                                {/* Display sender's anonymous name if it's not 'me' */}
                                <strong>{msg.sender === 'me' ? 'You' : msg.anonymousDisplayName || 'Stranger'}</strong>: {msg.text}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} /> {/* Scroll to bottom ref */}
                </div>

                {/* Input Bar */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={chatActive ? "Type your message..." : "Waiting for match..."}
                        disabled={!chatActive} // Disable input if chat is not active
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '12px',
                            fontSize: '16px',
                            backgroundColor: chatActive ? '#f9fafb' : '#f3f4f6',
                            outline: 'none',
                            opacity: chatActive ? 1 : 0.6
                        }}
                        onFocus={(e) => {
                            if (chatActive) {
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
                            cursor: (input.trim() && chatActive) ? 'pointer' : 'not-allowed',
                            opacity: (input.trim() && chatActive) ? 1 : 0.6
                        }}
                        disabled={!input.trim() || !chatActive} // Disable send button if chat is not active
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