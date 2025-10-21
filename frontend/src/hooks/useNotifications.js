// src/hooks/useNotifications.js
import { useEffect, useState, useContext, useRef } from "react";
import useWebSocket from "./useWebSocket";
import API from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

/**
 * useNotifications
 * - loads initial notifications + unread count
 * - subscribes to WS at /ws/notifications/?token=...
 * - incoming messages expected types: "notification" or "notification_new"
 *
 * Returns { notifications, unread, markRead, markAll }
 */
export default function useNotifications() {
    const { user } = useContext(AuthContext);
    const token = user?.token;
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const seenIdsRef = useRef(new Set());

    // initial fetch
    useEffect(() => {
        let mounted = true;
        if (!token) {
            setNotifications([]);
            setUnread(0);
            seenIdsRef.current.clear();
            return;
        }

        const load = async () => {
            try {
                const [countRes, listRes] = await Promise.all([
                    API.get("/notifications/unread-count/"),
                    API.get("/notifications/"),
                ]);
                if (!mounted) return;
                setUnread(countRes.data?.unread || 0);
                const list = listRes.data.results || listRes.data || [];
                // record seen ids
                const ids = new Set(list.map((n) => n.id));
                seenIdsRef.current = ids;
                setNotifications(list);
            } catch (err) {
                console.error("Failed to load notifications", err);
            }
        };

        load();
        return () => { mounted = false; };
    }, [token]);

    // WebSocket subscription
    useWebSocket({
        url: "/ws/notifications/",
        token,
        onMessage: (msg) => {
            if (!msg) return;
            const t = msg.type;
            if (t === "notification" || t === "notification_new") {
                const note = msg.notification;
                if (!note || !note.id) return;
                // dedupe
                if (seenIdsRef.current.has(note.id)) return;
                seenIdsRef.current.add(note.id);
                setNotifications((prev) => [note, ...prev]);
                setUnread((c) => c + 1);
            }
        },
        reconnect: true,
    });

    const markRead = async (id) => {
        try {
            await API.post(`/notifications/${id}/mark-read/`);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
            setUnread((c) => Math.max(0, c - 1));
        } catch (err) {
            console.error("markRead failed", err);
            throw err;
        }
    };

    const markAll = async () => {
        try {
            await API.post("/notifications/mark-all-read/");
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnread(0);
        } catch (err) {
            console.error("markAll failed", err);
            throw err;
        }
    };

    return { notifications, unread, markRead, markAll };
}
