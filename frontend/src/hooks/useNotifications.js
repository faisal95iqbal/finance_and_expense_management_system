// src/hooks/useNotifications.js
import { useEffect, useState, useContext } from "react";
import useWebSocket from "./useWebSocket";
import API from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

export default function useNotifications() {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const token = user?.token;

    useEffect(() => {
        if (!token) return;
        let mounted = true;
        API.get("/notifications/unread-count/")
            .then((res) => mounted && setUnread(res.data.unread))
            .catch(() => { });
        API.get("/notifications/")
            .then((res) => mounted && setNotifications(res.data.results || res.data))
            .catch(() => { });
        return () => (mounted = false);
    }, [token]);

    const onMessage = (msg) => {
        if (!msg) return;
        if (msg.type === "notification" || msg.type === "notification_new") {
            setNotifications((p) => [msg.notification, ...p]);
            setUnread((c) => c + 1);
        }
    };

    const wsBase = "ws://127.0.0.1:8000/ws/notifications/"; // or use env
    useWebSocket({ url: wsBase, token, onMessage });

    const markRead = async (id) => {
        await API.post(`/notifications/${id}/mark-read/`);
        setNotifications((p) => p.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        setUnread((c) => Math.max(0, c - 1));
    };

    const markAll = async () => {
        await API.post("/notifications/mark-all-read/");
        setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
        setUnread(0);
    };

    return { notifications, unread, markRead, markAll };
}
