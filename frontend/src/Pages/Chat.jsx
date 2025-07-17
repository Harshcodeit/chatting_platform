import React from "react";
import { useState } from "react";
import { Container, Card, Form, Button, Row, Col, Badge, Dropdown } from "react-bootstrap"
import { Search ,Send,MoreVertical,Pin,Phone,Video} from "lucide-react"

function Chat(){
    const [selectedChat,setSelectedChat]=useState('Marry Maguire')
    const [message,setMessage]=useState('')
    const [activeTab,setActiveTab]=useState('All')

    const conversations=[
    {
      id: 1,
      name: 'Harry Maguire',
      lastMessage: 'You need to improve now',
      time: '09:12 AM',
      unread: 0,
      isOnline: true,
      isPinned: true,
      avatar: '👤'
    },
    {
      id: 2,
      name: 'United Family',
      lastMessage: 'Rashford is typing...',
      time: '06:25 AM',
      unread: 0,
      isOnline: false,
      isGroup: true,
      avatar: '😈'
    },
    {
      id: 3,
      name: 'Ramsus Højlund',
      lastMessage: 'Bos, I need to talk today',
      time: '03:11 AM',
      unread: 2,
      isOnline: false,
      avatar: '👤'
    },
    {
      id: 4,
      name: 'Andre Onana',
      lastMessage: 'I need more time bos 😊',
      time: '11:34 AM',
      unread: 0,
      isOnline: true,
      avatar: '👤'
    },
    {
      id: 5,
      name: 'Regulion',
      lastMessage: 'Great performance lad 🔥',
      time: '09:12 AM',
      unread: 0,
      isOnline: false,
      avatar: '👤'
    },
    {
      id: 6,
      name: 'Bruno Fernandes',
      lastMessage: 'Play the game Bruno !',
      time: '10:21 AM',
      unread: 0,
      isOnline: false,
      avatar: '👤'
    }
    ]
    const currentMessages = [
        {
      id: 1,
      sender: 'Harry Maguire',
      message: "Hey lads, tough game yesterday. Let's talk about what went wrong and how we can improve 😊.",
      time: '08:34 AM',
      isOwn: false
    },
    {
      id: 2,
      sender: 'Bruno Fernandes',
      message: "Agreed, Harry 👍. We had some good moments, but we need to be more clinical in front of the goal 😔.",
      time: '08:34 AM',
      isOwn: false
    },
    {
      id: 3,
      sender: 'You',
      message: "We need to control the midfield and exploit their defensive weaknesses. Bruno and Paul, I'm counting on your creativity. Marcus and Jadon, stretch their defense wide. Use your pace and take on their full-backs.",
      time: '08:34 AM',
      isOwn: true
    }
    ]

    const handleSendMessage=()=>{
        if(message.trim()){
            console.log('Sending Message:',message)
            setMessage('')
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
                <Button variant="outline-primary" size="sm">
                  <Search size={16} />
                </Button>
              </div>
              
              {/* Tabs */}
              <div className="d-flex gap-3">
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
            </div>

            {/* Pinned Message */}
            <div className="p-3 border-bottom bg-white">
              <div className="d-flex align-items-center text-muted mb-2">
                <Pin size={14} className="me-2" />
                <small>Pinned Message</small>
              </div>
              <div className="d-flex align-items-center">
                <div className="me-3">👤</div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">Harry Maguire</div>
                  <small className="text-muted">You need to improve now</small>
                </div>
                <div className="text-muted">
                  <Pin size={12} />
                  <small className="ms-1">09:12 AM</small>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-grow-1 overflow-auto">
              {conversations.map(conv => (
                <div 
                  key={conv.id}
                  className={`p-3 border-bottom cursor-pointer ${selectedChat === conv.name ? 'bg-primary bg-opacity-10' : ''}`}
                  onClick={() => setSelectedChat(conv.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center">
                    <div className="position-relative me-3">
                      <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" 
                           style={{ width: '40px', height: '40px' }}>
                        {conv.avatar}
                      </div>
                      {conv.isOnline && (
                        <div className="position-absolute bottom-0 end-0 bg-success rounded-circle" 
                             style={{ width: '12px', height: '12px', border: '2px solid white' }}></div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="fw-semibold">{conv.name}</div>
                        <small className="text-muted">{conv.time}</small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted text-truncate" style={{ maxWidth: '200px' }}>
                          {conv.lastMessage}
                        </small>
                        {conv.unread > 0 && (
                          <Badge bg="danger" className="rounded-pill">{conv.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Main Chat Area */}
        <Col md={8} lg={9} className="d-flex flex-column">
          {/* Chat Header */}
          <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="position-relative me-3">
                <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" 
                     style={{ width: '40px', height: '40px' }}>
                  👤
                </div>
                <div className="position-absolute bottom-0 end-0 bg-success rounded-circle" 
                     style={{ width: '12px', height: '12px', border: '2px solid white' }}></div>
              </div>
              <div>
                <div className="fw-semibold">{selectedChat}</div>
                <small className="text-success">Online</small>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm">
                <Phone size={16} />
              </Button>
              <Button variant="outline-primary" size="sm">
                <Video size={16} />
              </Button>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  <MoreVertical size={16} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>View Profile</Dropdown.Item>
                  <Dropdown.Item>Mute</Dropdown.Item>
                  <Dropdown.Item>Block</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          {/* Today Header */}
          <div className="text-center p-2 bg-light">
            <small className="text-muted">Today</small>
          </div>

          {/* Messages */}
          <div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#f8f9fa' }}>
            {currentMessages.map(msg => (
              <div key={msg.id} className={`mb-3 d-flex ${msg.isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
                {!msg.isOwn && (
                  <div className="me-2">
                    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" 
                         style={{ width: '32px', height: '32px' }}>
                      👤
                    </div>
                  </div>
                )}
                <div className={`max-width-70 ${msg.isOwn ? 'text-end' : ''}`}>
                  {!msg.isOwn && (
                    <div className="fw-semibold mb-1 small">{msg.sender}</div>
                  )}
                  <div 
                    className={`p-3 rounded-3 ${msg.isOwn ? 'bg-primary text-white' : 'bg-white'}`}
                    style={{ maxWidth: '70%', display: 'inline-block' }}
                  >
                    {msg.message}
                  </div>
                  <div className="small text-muted mt-1">
                    {msg.isOwn ? 'You' : msg.sender} • {msg.time}
                    {msg.isOwn && <span className="ms-1">✓✓</span>}
                  </div>
                </div>
              </div>
            ))}
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
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      </div>
    </Container>
  );
}
export default Chat
