import React from "react";
//hooks
import { useState,useEffect,useRef } from "react";

//react-bootstrap
import { Container, Card, Form, Button, Row, Col, Badge, Dropdown,Modal } from "react-bootstrap"

//lucide-react
import { Search ,Send,MoreVertical,Pin,Phone,Video,Plus,Users} from "lucide-react"

//firebase
import { useFirebase } from "../Firebase/Firebase";

//routing
import { useNavigate } from "react-router-dom";

function Chat(){
    const firebase=useFirebase();
    const [selectedChat,setSelectedChat]=useState(null)
    const [selectedUser,setSelectedUser]=useState(null)
    const [message,setMessage]=useState('')
    const [activeTab,setActiveTab]=useState('All')
    const [messages,SetMessages]=useState([])
    const [users,setUsers]=useState([])
    const [chats,setChats]=useState([])
    const [showNewChatModal,setShowNewChatModal]=useState(false)
    const [searchTerm,setSearchTerm]=useState('')

    const navigate=useNavigate()
    const messagesEndRef=useRef(null)

    //Scroll to bottom when messages change
    const scrollToBottom=()=>{
      messagesEndRef.current?.scrollIntoView({behaviour:"smooth"})
    }
    useEffect(()=>{
      scrollToBottom()
    },[messages])

    //Listen to users
    useEffect(()=>{
      if(!firebase.user){
        setUsers([]) //reset when logged out
        return
      }
      const unsubscribe=firebase.listenToUsers((usersList)=>{
        setUsers(usersList)
      })

      return ()=>unsubscribe()
    },[firebase.user])

    //Listen to chats
    useEffect(()=>{
      if(!firebase.user){
        setChats([])
        return 
      }
      const unsubscribe=firebase.listenToChats((chatsList)=>{
        setChats(chatsList)
      })

      return ()=>unsubscribe()
    },[firebase.user])

    //Listen to messages for selected chat
    useEffect(()=>{
      if(!selectedChat){
        SetMessages([])
        return 
      }
      const unsubscribe=firebase.listenToMessages(selectedChat,(messagesList)=>{
        SetMessages(messagesList)
      })

      return ()=>unsubscribe()
    },[selectedChat])

    const handleLogout=async()=>{
      try{
        await firebase.logout();
        //reset all state
        setSelectedChat(null)
        setSelectedUser(null)
        setChats([])
        SetMessages([])
        setUsers([])
        navigate('/signup')
      } catch(error){
        console.error("Logout failed:",error)
      }
    }
    
    const handleSendMessage=async()=>{
        if(!message.trim() || !selectedChat) return
        try{
          await firebase.sendMessage(selectedChat,message,selectedUser?.uid)
          setMessage('')
        }
        catch(error){
          console.error("Error sending message:",message)
        }
    }
    
    const handleStartChat=(user)=>{
      const chatId=firebase.generateChatId(firebase.user.uid,user.uid)
      setSelectedChat(chatId)
      setSelectedUser(user)
      setShowNewChatModal(false)
    }

    const handleSelectExistingChat=(chat)=>{
      setSelectedChat(chat.id)
      //find other participant
      const otherUserId=chat.participants?.find(id=>id!==firebase.user.uid)
      const otherUser=users.find(u=>u.uid=== otherUserId)
      setSelectedUser(otherUser)
    }

    const formatTime=(timestamp)=>{
      if(!timestamp) return ''
      const date=new Date(timestamp)
      return date.toLocaleTimeString('en-US',{
        hour:'2-digit',
        minute:'2-digit',
        hour12:true
      })
    }

    const filteredUsers=users.filter(user=>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getDisplayName=(user)=>{
      return user?.username || user?.displayName || user?.email?.split('@')[0] || 'Unknown User'
    }

    const getChatDisplayInfo=(chat)=>{
      const otherUserId=chat.participants?.find(id=>id !==firebase.user.uid)
      const otherUser=users.find(u=>u.uid===otherUserId)
      return{
        name:getDisplayName(otherUser),
        user:otherUser,
        lastMessage:chat.lastMessage || 'No messages yet',
        time: formatTime(chat.lastMessageTime),
        isOnline:otherUser?.isOnline || false
      }
    }

    return (
        <Container fluid className="chat-container p-0" style={{ height: '100vh' }}>
            <div className="chat-window">
                <Row className="h-100 g-0">
                    {/* Sidebar */}
                    <Col md={4} lg={3} className="border-end bg-light">
                        <div className="chat-sidebar h-100 d-flex flex-column">
                            {/* Header */}
                            <div className="p-3 border-bottom bg-white">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0 fw-bold">Messages</h5>
                                    <div className="d-flex gap-2">
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm"
                                            onClick={() => setShowNewChatModal(true)}
                                        >
                                            <Plus size={16} />
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                                            Logout
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Tabs */}
                                <div className="d-flex gap-3 justify-content-between align-items-center">
                                    <div className="d-flex gap-2">
                                        {['All', 'Personal', 'Groups'].map(tab => (
                                            <button
                                                key={tab}
                                                className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                onClick={() => setActiveTab(tab)}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                    <Button variant="outline-primary" size="sm">
                                        <Search size={16}/>
                                    </Button>
                                </div>
                            </div>

                            {/* User Info */}
                            {firebase.user && (
                                <div className="p-3 border-bottom bg-white">
                                    <div className="d-flex align-items-center">
                                        <div className="me-3">
                                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                                                 style={{ width: '32px', height: '32px' }}>
                                                {getDisplayName(firebase.user).charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">{getDisplayName(firebase.user)}</div>
                                            <small className="text-success">Online</small>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Chats List */}
                            <div className="flex-grow-1 overflow-auto">
                                {chats.length === 0 ? (
                                    <div className="p-3 text-center text-muted">
                                        <div className="mb-2">No conversations yet</div>
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm"
                                            onClick={() => setShowNewChatModal(true)}
                                        >
                                            Start a conversation
                                        </Button>
                                    </div>
                                ) : (
                                    chats.map(chat => {
                                        const displayInfo = getChatDisplayInfo(chat)
                                        return (
                                            <div 
                                                key={chat.id}
                                                className={`p-3 border-bottom cursor-pointer ${selectedChat === chat.id ? 'bg-primary bg-opacity-10' : ''}`}
                                                onClick={() => handleSelectExistingChat(chat)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <div className="position-relative me-3">
                                                        <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
                                                             style={{ width: '40px', height: '40px' }}>
                                                            {displayInfo.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        {displayInfo.isOnline && (
                                                            <div className="position-absolute bottom-0 end-0 bg-success rounded-circle" 
                                                                 style={{ width: '12px', height: '12px', border: '2px solid white' }}></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="fw-semibold">{displayInfo.name}</div>
                                                            <small className="text-muted">{displayInfo.time}</small>
                                                        </div>
                                                        <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                                                            {displayInfo.lastMessage}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* Main Chat Area */}
                    <Col md={8} lg={9} className="d-flex flex-column">
                        {selectedChat && selectedUser ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <div className="position-relative me-3">
                                            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
                                                 style={{ width: '40px', height: '40px' }}>
                                                {getDisplayName(selectedUser).charAt(0).toUpperCase()}
                                            </div>
                                            {selectedUser.isOnline && (
                                                <div className="position-absolute bottom-0 end-0 bg-success rounded-circle" 
                                                     style={{ width: '12px', height: '12px', border: '2px solid white' }}></div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="fw-semibold">{getDisplayName(selectedUser)}</div>
                                            <small className={selectedUser.isOnline ? 'text-success' : 'text-muted'}>
                                                {selectedUser.isOnline ? 'Online' : 'Offline'}
                                            </small>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Dropdown>
                                            <Dropdown.Toggle variant="outline-secondary" size="sm">
                                                <MoreVertical size={16} />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item
                                                    onClick={async ()=>{
                                                        if(window.confirm("Are you sure you want to delete this chat?")){
                                                            await firebase.deleteChat(selectedChat)
                                                            setSelectedChat(null)
                                                            setSelectedUser(null)
                                                            SetMessages([])
                                                        }
                                                    }}
                                                    className="text-danger"
                                                >
                                                    Delete Chat
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#f8f9fa' }}>
                                    {messages.length === 0 ? (
                                        <div className="text-center text-muted mt-5">
                                            <div className="mb-3">
                                                <Users size={48} className="text-muted" />
                                            </div>
                                            <div>Start a conversation with {getDisplayName(selectedUser)}</div>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => {
                                            const isOwn = msg.senderId === firebase.user.uid
                                            const showSender = !isOwn && (index === 0 || messages[index - 1].senderId !== msg.senderId)
                                            
                                            return (
                                                <div key={msg.id} className={`mb-3 d-flex ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
                                                    {!isOwn && (
                                                        <div className="me-2">
                                                            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
                                                                 style={{ width: '32px', height: '32px' }}>
                                                                {(msg.senderName || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className={`max-width-70 ${isOwn ? 'text-end' : ''}`}>
                                                        {showSender && (
                                                            <div className="fw-semibold mb-1 small">{msg.senderName}</div>
                                                        )}
                                                        <div 
                                                            className={`p-3 rounded-3 ${isOwn ? 'bg-primary text-white' : 'bg-white'}`}
                                                            style={{ maxWidth: '70%', display: 'inline-block' }}
                                                        >
                                                            {msg.isDeleted? (
                                                                <i className="text-muted">This message was deleted</i>
                                                            ) :(
                                                                <>
                                                                    {msg.message}
                                                                    {isOwn && (
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            className="text-danger p-0 ms-2"
                                                                            onClick={()=>firebase.deleteMessage(msg.id)}
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )} 
                                                        </div>
                                                        <div className="small text-muted mt-1">
                                                            {formatTime(msg.timestamp)}
                                                            {isOwn && <span className="ms-1">✓✓</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-3 border-top bg-white">
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="Type a message..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            className="rounded-pill"
                                        />
                                        <Button 
                                            variant="primary" 
                                            className="rounded-pill px-3"
                                            onClick={handleSendMessage}
                                            disabled={!message.trim()}
                                        >
                                            <Send size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                                <div className="text-center text-muted">
                                    <div className="mb-3">
                                        <Send size={64} className="text-muted" />
                                    </div>
                                    <h5>Select a conversation</h5>
                                    <p>Choose a conversation from the sidebar to start chatting</p>
                                    <Button 
                                        variant="primary"
                                        onClick={() => setShowNewChatModal(true)}
                                    >
                                        Start New Chat
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
            </div>

            {/* New Chat Modal */}
            <Modal show={showNewChatModal} onHide={() => setShowNewChatModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Start New Chat</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Control
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-3"
                    />
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {filteredUsers.length === 0 ? (
                            <div className="text-center text-muted py-4">
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div 
                                    key={user.uid}
                                    className="d-flex align-items-center p-3 border-bottom cursor-pointer hover-bg-light"
                                    onClick={() => handleStartChat(user)}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    <div className="position-relative me-3">
                                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                                             style={{ width: '40px', height: '40px' }}>
                                            {getDisplayName(user).charAt(0).toUpperCase()}
                                        </div>
                                        {user.isOnline && (
                                            <div className="position-absolute bottom-0 end-0 bg-success rounded-circle" 
                                                 style={{ width: '12px', height: '12px', border: '2px solid white' }}></div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="fw-semibold">{getDisplayName(user)}</div>
                                        <small className="text-muted">{user.email}</small>
                                        <div>
                                            <small className={user.isOnline ? 'text-success' : 'text-muted'}>
                                                {user.isOnline ? 'Online' : 'Offline'}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Modal.Body>
            </Modal>
        </Container>
    );
}
export default Chat
