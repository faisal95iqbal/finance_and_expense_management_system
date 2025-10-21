// src/pages/ActivityFeed.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import API from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import useWebSocket from "../hooks/useWebSocket";
import { ListGroup, Spinner, Button } from "react-bootstrap";

export default function ActivityFeed() {
    const { user } = useContext(AuthContext);
    const [activities, setActivities] = useState([]); // newest-first
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const listRef = useRef(null);

    const fetchPage = async (p = 1) => {
        if (!user) return;
        setLoading(true);
        try {
            // backend route: /api/notifications/activities/
            const res = await API.get(`/notifications/activities/?page=${p}`);
            const results = res.data.results || res.data || [];
            if (p === 1) {
                setActivities(results);
            } else {
                setActivities((prev) => [...prev, ...results]);
            }
            setHasMore(Boolean(res.data.next));
        } catch (err) {
            console.error("Failed to fetch activity feed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        setPage(1);
        fetchPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useWebSocket({
        url: user ? `/ws/business/${user.business_id}/activity/` : null,
        token: user?.token,
        onMessage: (msg) => {
            if (!msg) return;
            if (msg.type === "activity" || msg.type === "activity_new") {
                // prepend newest activity
                setActivities((prev) => [msg.activity, ...prev]);
                // optionally keep list length bounded if you want (not necessary)
            }
        },
        reconnect: true,
    });

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchPage(next);
    };

    return (
        <div>
            <h3>Activity Feed</h3>
            <div ref={listRef} style={{ maxHeight: 480, overflowY: "auto", border: "1px solid #e9ecef", padding: 8 }}>
                {activities.length === 0 && loading ? (
                    <div className="text-center py-4"><Spinner animation="border" /></div>
                ) : (
                    <ListGroup>
                        {activities.map((a) => (
                            <ListGroup.Item key={a.id}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div><strong>{a.action_type || a.verb || "activity"}</strong> — {a.model_name || ""} {a.object_id ? `#${a.object_id}` : ""}</div>
                                    <div><small className="text-muted">{new Date(a.timestamp || a.created_at).toLocaleString()}</small></div>
                                </div>
                                <div style={{ fontSize: 13, marginTop: 6 }}>
                                    {a.actor ? `${a.actor.email || "System"} (${a.actor.role || ""})` : "System"}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </div>

            <div className="text-center my-3">
                {hasMore ? (
                    <Button onClick={loadMore} disabled={loading}>{loading ? "Loading..." : "Load more"}</Button>
                ) : (
                    <div className="text-muted">No more activities</div>
                )}
            </div>
        </div>
    );
}
