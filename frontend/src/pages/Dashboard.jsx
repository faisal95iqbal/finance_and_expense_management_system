// src/pages/Dashboard.js
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);

    return (
        <div style={{ padding: 20 }}>
            <h1>Dashboard</h1>
            <p>Welcome — your role: <strong>{user?.role}</strong></p>
            <p> Email: {user?.email}</p>
            <p>Business ID: <strong>{user?.business_id ?? "N/A"}</strong></p>
            <button onClick={logout}>Logout</button>
        </div>
    );
}
