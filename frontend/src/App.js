import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [currentDot, setCurrentDot] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDot((prev) => (prev + 1) % 3);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartChat = () => {
    // Add your chat start logic here
    console.log('Starting chat...');
    // For example, you might navigate to a chat screen or show a chat interface
  };

  return (
    <Container fluid className="app-container">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="welcome-card border-0 shadow-lg">
            <Card.Body className="text-center p-4">
              {/* Chat Icons */}
              <div className="chat-icons mb-4">
                <div className="chat-bubble primary">
                  💬
                </div>
                <div className="chat-bubble secondary">
                  🤖
                </div>
                <div className="floating-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>

              {/* Welcome Text */}
              <Card.Title className="welcome-title mb-3">
                Welcome to Chatty
              </Card.Title>
              <Card.Text className="welcome-subtitle text-muted mb-4">
                Chat with your friends, share photos and videos they talk with right away.
              </Card.Text>

              {/* Progress Dots */}
              <div className="progress-dots mb-4">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`progress-dot ${index === currentDot ? 'active' : ''}`}
                  />
                ))}
              </div>

              {/* Start Button */}
              <Button 
                className="start-button w-100" 
                size="lg"
                onClick={handleStartChat}
              >
                Start Chat
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;