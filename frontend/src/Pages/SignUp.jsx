import React from "react";

//hooks
import { useState, useEffect } from "react";

//bootstrap
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
} from "react-bootstrap";

//routing
import { Link, useNavigate } from "react-router-dom";

//firebase
import { useFirebase } from "../Firebase/Firebase";

const SignUp = () => {
  const firebase = useFirebase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUserNameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (firebase.isLoggedIn) {
      navigate("/chat");
    }
  }, [firebase.isLoggedIn, navigate]);

  //check username availability
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUserNameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const exists = await firebase.checkUsernameExists(username);
      setUserNameAvailable(!exists);
    } catch (error) {
      console.error("Error checking username:", error);
      setUserNameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  //Debounded username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userName) {
        checkUsernameAvailability(userName);
      }
    }, 500);
    return () => clearInterval(timeoutId);
  }, [userName]);

  const validateForm = () => {
    if (!userName.trim()) {
      setError("Username is required");
      return false;
    }
    if (userName.length < 3) {
      setError("Username must be atleast 3 characters long");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(userName)) {
      setError("Username can only contain letters,numbers and underscores");
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!password.trim()) {
      setError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be atleast 6 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (usernameAvailable === false) {
      setError("Username is already taken");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); //stops default behaviour
    setError("");

    if (!validateForm()) return;
    setLoading(true);

    try {
      console.log("Sign up attempt:", { email, password, userName });
      console.log("Signed up in user");
      await firebase.signupUserWithEmailAndPassword(email, password, userName);
      console.log("Success");
      navigate("/chat");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      console.log("Sign up with google");
      await firebase.signinWithGoogle();
      console.log("Google Sign up succesful!");
      navigate("/chat");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const getUsernameValidationColor = () => {
    if (checkingUsername) return "text-info";
    if (usernameAvailable === true) return "text-success";
    if (usernameAvailable === false) return "text-danger";
    if (userName && userName.length < 3) return "text-warning";
    if (userName && !/^[a-zA-Z0-9_]+$/.test(userName)) return "text-danger";
    return "text-muted";
  };

  const getUsernameValidationMessage = () => {
    if (!userName) return null;
    if (userName.length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(userName))
      return "Only letters, numbers, and underscores allowed";
    if (checkingUsername) return "Checking availability...";
    if (usernameAvailable === true) return "Username is available!";
    if (usernameAvailable === false) return "Username is already taken";
    return null;
  };
  return (
    <Container fluid className="app-container">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="auth-card border-0 shadow-lg">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="auth-title">Sign Up</h2>
                <p className="text-muted">Welcome back to ChatZone!</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>UserName</Form.Label>
                  <Form.Control
                    type="text"
                    name="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your username"
                    required
                    isValid={usernameAvailable === true}
                    isInvalid={
                      usernameAvailable === false ||
                      (userName && userName.length < 3) ||
                      (userName && !/^[a-zA-Z0-9_]+$/.test(userName))
                    }
                  />
                  <Form.Text className={getUsernameValidationColor()}>
                    {getUsernameValidationMessage()}
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <Form.Text className="text-muted">
                    Password must be at least 6 characters long
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    isInvalid={confirmPassword && password !== confirmPassword}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <Form.Text className="text-danger">
                      Passwords do not match
                    </Form.Text>
                  )}
                </Form.Group>

                <Button
                  className="w-100 mb-3"
                  type="submit"
                  disabled={
                    loading || usernameAvailable === false || checkingUsername
                  }
                  size="lg"
                >
                  {loading ? "Signing Up..." : "Sign Up"}
                </Button>
              </Form>

              <div className="text-center mb-3">
                <p className="mb-2">or</p>
                <Button
                  variant="success"
                  className="w-100"
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                >
                  {loading ? "Signing Up..." : "Sign Up with Google"}
                </Button>
              </div>
              <div className="text-center">
                <p className="mb-0">
                  Already have an account?{" "}
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
};
export default SignUp;
