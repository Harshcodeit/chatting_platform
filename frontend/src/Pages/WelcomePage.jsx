import React from "react"
import { useState,useEffect } from "react"
import { Container, Card, Button, Row, Col } from "react-bootstrap"
import { useNavigate } from "react-router-dom"

function WelcomePage(){
    const [currentDot,setCurrentDot]=useState(0)
    const navigate=useNavigate()

    useEffect(()=>{
        const interval=setInterval(()=>{
            setCurrentDot((prev)=>(prev+1)%3)
        },1000)

        return ()=> clearInterval(interval)
    },[])

    const handleStartChat=()=>{
        navigate('/signin')
    }
    const handleAnonymousChat=()=>{
      navigate('/interests')
    }
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
                Welcome to ChatZone
              </Card.Title>
              <Card.Text className="welcome-subtitle text-muted mb-4">
                Chat with your friends or match with people anonymously.
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
              <div><br></br></div>
              <Button 
                className="start-button w-100"
                size="lg"
                onClick={handleAnonymousChat}
              >
              Anonymous Chat👀
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
export default WelcomePage;
