import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function LoginPage() {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const nav = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            nav("/dashboard");
        } catch (err) {
            setError("Invalid credentials");
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-4">
                    <h3 className="mb-3">Sign In</h3>
                    <form onSubmit={submit}>
                        <div className="mb-3">
                            <label className="form-label">Username</label>
                            <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        {error && <div className="alert alert-danger">{error}</div>}
                        <button className="btn btn-primary w-100">Login</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
