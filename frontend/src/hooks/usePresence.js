import { useEffect, useState } from "react";
import API from "../api/api";

export default function usePresence(businessId) {
    const [onlineUsers, setOnlineUsers] = useState([]);

    const fetchOnline = async () => {
        try {
            const res = await API.get(`/notifications/chat/online_users/`);
            setOnlineUsers(res.data);
        } catch (err) {
            console.error("Presence fetch failed", err);
        }
    };

    useEffect(() => {
        fetchOnline();
        const interval = setInterval(fetchOnline, 10000); // poll every 10s
        return () => clearInterval(interval);
    }, [businessId]);

    return onlineUsers;
}
