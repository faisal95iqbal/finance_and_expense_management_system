import React, { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    return (
        <div className="container mt-4">
            <h2>Dashboard</h2>
            <p>Welcome, {user ? user.first_name || user.username : "User"}!</p>
            <p>This is a placeholder dashboard. We'll add charts and widgets next.</p>
        </div>
    );
}
