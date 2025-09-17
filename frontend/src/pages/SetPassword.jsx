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
