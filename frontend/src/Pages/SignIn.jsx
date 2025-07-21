import React from "react"

//hooks
import { useState ,useEffect } from "react"

//bootstrap
import { Container, Card, Form, Button, Row, Col, Alert } from "react-bootstrap"

//routing
import { Link, useNavigate} from "react-router-dom"

//firebase
import { useFirebase } from "../Firebase/Firebase"

const SignIn=()=>{
    const firebase=useFirebase()
    const [emailOrUsername,setEmailOrUsername]=useState("")
    const [password,setPassword]=useState("")
    const navigate=useNavigate()
    
    const [error,setError]=useState('')
    const [loading,setLoading]=useState(false)
    
    useEffect(()=>{
      if(firebase.isLoggedIn){
        navigate('/chat')
      }
    },[firebase.isLoggedIn,navigate])

    const handleSubmit=async (e)=>{
        e.preventDefault();//stops default behaviour
        setError('')
        setLoading(true)

        try{
          console.log('Sign in attempt:',{emailOrUsername,password})
          console.log("Signing in user")
          await firebase.signinUserWithEmailAndPassword(emailOrUsername,password)
          console.log("Sign in successful")
          navigate('/chat')
        } 
        catch(error){
          //more user friendly error messages
          let errorMessage=error.message
          if (error.message.includes('user-not-found') || error.message.includes('Username not found')) {
            errorMessage = 'No account found with this email or username'
          } 
          else if (error.message.includes('wrong-password')) {
            errorMessage = 'Incorrect password'
          } 
          else if (error.message.includes('invalid-email')) {
            errorMessage = 'Please enter a valid email address'
          } 
          else if (error.message.includes('too-many-requests')) {  
            errorMessage = 'Too many failed login attempts. Please try again later'
          }
          setError(errorMessage)
        } 
        finally{
          setLoading(false)
        }
    }
    const handleGoogleSignIn=async()=>{
      setError('')
      setLoading(true)
      try{
        console.log("Signing in with google")
        await firebase.signinWithGoogle()
        console.log("Google Sign in succesful!")
        navigate('/chat')
      } 
      catch(error){
        setError(error.message)
      } 
      finally{
        setLoading(false)
      }
    }
    
    const getPlaceholderText=()=>{
      return "Enter your email or username"
    }

    const getInputType=()=>{
      return emailOrUsername.includes('@') ? 'email' : 'text'
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
                  <Form.Label>Email/Username</Form.Label>
                  <Form.Control
                    type={getInputType()}
                    name={emailOrUsername}
                    value={emailOrUsername}
                    onChange={(e)=>setEmailOrUsername(e.target.value)}
                    placeholder={getPlaceholderText()}
                    required
                  />
                  <Form.Text className="text-muted">
                    *You can sign in with either your email address or username
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
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

              <div className="text-center mb-3">
                  <p className="mb-2">or</p>
                  <Button
                      variant="success"
                      className="w-100"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                  >
                      {loading ? 'Signing In...' : 'Sign In with Google'}
                  </Button>
              </div>
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