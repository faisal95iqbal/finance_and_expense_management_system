{/*
// src/pages/SetPasswordPage.jsx
import React, { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Container, Alert } from "react-bootstrap";
import API from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

export default function SetPassword() {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!password || password !== confirm) {
            setError("Passwords must match and not be empty.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await API.post("/auth/set-password/", {
                uid,
                token,
                new_password: password,
            });
            // backend returns access + refresh
            login({ access: res.data.access, refresh: res.data.refresh });
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.detail || "Failed to set password. Link may be expired.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container className="py-5" style={{ maxWidth: 600 }}>
            <h3>Set your password</h3>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                    <Form.Label>New password</Form.Label>
                    <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-2">
                    <Form.Label>Confirm password</Form.Label>
                    <Form.Control type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                </Form.Group>
                <Button type="submit" disabled={submitting}>{submitting ? "Setting..." : "Set password"}</Button>
            </Form>
        </Container>
    );
}
*/}

// src/pages/SetPasswordPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Container, Card, Alert, InputGroup } from "react-bootstrap";
import API from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import {toast} from "react-toastify";

export default function SetPassword() {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [strength, setStrength] = useState({ text: "", color: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);

    // Fade-in animation on mount
    useEffect(() => {
        const timer = setTimeout(() => setFadeIn(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Password strength calculation
    const evaluateStrength = (value) => {
        if (!value) return { text: "", color: "" };
        if (value.length < 6) return { text: "Weak password", color: "text-danger" };
        if (value.match(/[A-Z]/) && value.match(/[0-9]/) && value.match(/[^A-Za-z0-9]/))
            return { text: "Strong password", color: "text-success" };
        return { text: "Medium strength", color: "text-warning" };
    };

    useEffect(() => {
        setStrength(evaluateStrength(password));
    }, [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!password || password !== confirm) {
            setError("Passwords must match and not be empty.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await API.post("/auth/set-password/", {
                uid,
                token,
                new_password: password,
            });
            login({ access: res.data.access, refresh: res.data.refresh });
            toast.success("Password set successfully! Welcome aboard.");
            navigate("/dashboard");
        } catch (err) {
            toast.error("Failed to set password. Please try again.");
            setError(
                err?.response?.data?.detail || "Failed to set password. The link may have expired."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container
            className={`d-flex justify-content-center align-items-center py-5 ${fadeIn ? "opacity-100" : "opacity-0"
                }`}
            style={{
                minHeight: "90vh",
                transition: "opacity 0.6s ease",
            }}
        >
            <Card className="p-4 shadow-sm border-0 w-100" style={{ maxWidth: 480, borderRadius: 12 }}>
                <div className="text-center mb-3">
                    <i className="fas fa-lock fa-2x text-primary mb-2"></i>
                    <h4 className="fw-semibold">Set Your New Password</h4>
                    <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                        Please choose a secure password to activate your account.
                    </p>
                </div>

                {error && (
                    <Alert
                        variant="danger"
                        dismissible
                        onClose={() => setError("")}
                        className="py-2 mb-3"
                    >
                        <i className="fas fa-exclamation-circle me-2"></i>
                        {error}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>New Password</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Button
                                variant="outline-secondary"
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                            </Button>
                        </InputGroup>
                        {strength.text && (
                            <small className={`d-block mt-1 ${strength.color}`}>{strength.text}</small>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Confirm Password</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type={showConfirm ? "text" : "password"}
                                placeholder="Confirm password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />
                            <Button
                                variant="outline-secondary"
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                            >
                                <i className={`fas ${showConfirm ? "fa-eye-slash" : "fa-eye"}`}></i>
                            </Button>
                        </InputGroup>
                    </Form.Group>

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-100 py-2 mt-2"
                        style={{ fontWeight: 600 }}
                    >
                        {submitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin me-2"></i> Setting Password...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check me-2"></i> Set Password
                            </>
                        )}
                    </Button>
                </Form>
            </Card>
        </Container>
    );
}
