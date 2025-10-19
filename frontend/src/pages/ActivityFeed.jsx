// src/pages/ActivityFeed.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import API from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import useWebSocket from "../hooks/useWebSocket";
import { ListGroup, Spinner, Button } from "react-bootstrap";

export default function ActivityFeed() {
    const { user } = useContext(AuthContext);
    const [activities, setActivities] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const fetchPage = async (p = 1) => {
        setLoading(true);
        try {
            const res = await API.get(`/businesses/${user.business_id}/activity/?page=${p}`);
            const results = res.data.results || res.data;
            setActivities((prev) => (p === 1 ? results : [...prev, ...results]));
            setHasMore(Boolean(res.data.next));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    const fetchFeed = async (nextPage) => {
        const res = await API.get(`/activity/?page=${nextPage}`);
        setFeed((prev) => [...prev, ...res.data.results]);
      };

    useEffect(() => {
        if (!user) return;
        fetchPage(1);
        fetchFeed(1);
    }, [user]);

    // Websocket live feed
    useWebSocket({
        url: `/ws/business/${user?.business_id}/activity/`,
        token: user?.token,
        onMessage: (message) => {
            if (message.type === "activity" || message.type === "activity_new") {
                setActivities((p) => [message.activity, ...p]);
            }
        },
    });

    return (
        <div>
            <h3>Activity Feed</h3>
            <ListGroup>
                {activities.map((a) => (
                    <ListGroup.Item key={a.id}>
                        <div><strong>{a.action_type}</strong> — {a.model_name} #{a.object_id}</div>
                        <div><small>{a.actor?.email || "System"} — {new Date(a.timestamp).toLocaleString()}</small></div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
            {hasMore && (
                <div className="text-center my-3">
                    <Button onClick={() => { setPage(p => { const np = p + 1; fetchPage(np); return np }) }}>
                        {loading ? <Spinner size="sm" /> : "Load more"}
                    </Button>
                </div>
            )}
            <div
                onScroll={(e) => {
                    if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight) {
                        fetchFeed(page + 1);
                        setPage(p => p + 1);
                    }
                }}
            >
                {activities.map(item => <div>{item.verb}</div>)}
            </div>
        </div>
    );
}
