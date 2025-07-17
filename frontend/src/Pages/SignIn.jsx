import { useState } from "react"
import { Container, Card, Form, Button, Row, Col, Alert } from "react-bootstrap"
import { Link, useNavigate} from "react-router-dom"

function SignIn(){
    const [formData,setFormData]=useState({
        email:'',
        password:''
    })
    const [error,setError]=useState('')
    const [loading,setLoading]=useState(false)
    const navigate=useNavigate()

    const handleChange=(e)=>{
        setFormData({
            ...formData,
            [e.target.name]:e.target.value
        })
    }
    const handleSubmit=async (e)=>{
        e.preventDefault();
        setError('')
        setLoading(true)

        try{
            console.log('Sign in attempt:',formData)
            navigate('/chat')
        } catch(error){
            setError(error.message)
        } finally{
            setLoading(false)
        }
    }
    return (
    <Container fluid className="app-container">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="auth-card border-0 shadow-lg">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="auth-title">Sign In</h2>
                <p className="text-muted">Welcome back to ChatZone!</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                </Form.Group>

                <Button 
                  className="w-100 mb-3" 
                  type="submit"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-decoration-none">
                    Sign Up
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
export default SignIn