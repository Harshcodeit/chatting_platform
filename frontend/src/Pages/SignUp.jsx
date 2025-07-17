import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Add your Firebase sign up logic here
      console.log('Sign up attempt:', formData);
      
      // Example: await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // On success, navigate to chat
      navigate('/chat');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="app-container">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="auth-card border-0 shadow-lg">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="auth-title">Sign Up</h2>
                <p className="text-muted">Join ChatZone today!</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </Form.Group>

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
                    placeholder="Create a password"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                </Form.Group>

                <Button 
                  className="w-100 mb-3" 
                  type="submit"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0">
                  Already have an account?{' '}
                  <Link to="/signin" className="text-decoration-none">
                    Sign In
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

export default SignUp;