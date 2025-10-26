import { useState, useContext } from "react";
import { Container, Form, Button, Alert, Spinner, Card, InputGroup } from "react-bootstrap";
import {toast} from 'react-toastify';
import { AuthContext } from "../contexts/AuthContext";
import "./loginstyles.css";

const LoginPage = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(email, password);
        if (!success) {
            setError("  Invalid email or password");
            setLoading(false);
            toast.error("Login failed. Please check your credentials.");
        } else {
            toast.success("Login successful!");
            window.location.href = "/dashboard"; // redirect after login
            
        }
    };

    return (
        <div className="login-wrapper d-flex align-items-center justify-content-center">
            <Container style={{ maxWidth: "440px" }}>
                <Card className="p-4 shadow-lg border-0 login-card">
                    <h4 className="text-center mb-4 text-white fw-semibold">
                        <i className="fas fa-user-circle me-2"></i>Login To Access Portal
                    </h4>

                    {error && <Alert variant="danger"><i className="fas fa-exclamation-triangle"></i>{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="formEmail" className="mb-3">
                            <Form.Label className="text-white">Email</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light">
                                    <i className="fas fa-envelope text-primary"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group controlId="formPassword" className="mb-4">
                            <Form.Label className="text-white">Password</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light">
                                    <i className="fas fa-lock text-primary"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </InputGroup>
                        </Form.Group>

                        <Button
                            variant="light"
                            type="submit"
                            className="w-100 fw-semibold login-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    Please wait Logging in...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt me-2"></i>Login
                                </>
                            )}
                        </Button>
                    </Form>
                </Card>
            </Container>
        </div>
    );
};

export default LoginPage;
