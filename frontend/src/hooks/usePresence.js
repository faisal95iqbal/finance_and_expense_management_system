import { useEffect, useState, useContext } from "react";
import API from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

/**
 * usePresence Hook
 * Fetches and maintains a list of online users for the current business.
 * Polls the backend every 10 seconds, but only when the user is authenticated.
 */
export default function usePresence(businessId) {
    const { user } = useContext(AuthContext);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOnline = async () => {
        if (!user?.token || !businessId) return; // Ensure user and business are loaded
        setLoading(true);
        try {
            const res = await API.get(`/notifications/chat/online_users/`);
            setOnlineUsers(res.data);
        } catch (err) {
            console.error("Presence fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user?.token || !businessId) return;

        // Initial fetch
        fetchOnline();

        // Poll every 10 seconds
        const interval = setInterval(fetchOnline, 10000);
        return () => clearInterval(interval);
    }, [businessId, user?.token]);

    return { onlineUsers, loading };
}
