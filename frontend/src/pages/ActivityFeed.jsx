{/* 
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
*/}

// src/pages/ActivityFeed.jsx
import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import { Card, ListGroup, Spinner, Button, Form, InputGroup } from "react-bootstrap";
import API from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import useWebSocket from "../hooks/useWebSocket";

//import "./ActivityFeed.css"; // fade + hover animations

export default function ActivityFeed() {
    const { user } = useContext(AuthContext);
    const [activities, setActivities] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const listRef = useRef(null);

    // Fetch activities
    const fetchPage = async (p = 1) => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await API.get(`/notifications/activities/?page=${p}`);
            const results = res.data.results || res.data || [];
            if (p === 1) setActivities(results);
            else setActivities((prev) => [...prev, ...results]);
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

    // WebSocket live updates
    useWebSocket({
        url: user ? `/ws/business/${user.business_id}/activity/` : null,
        token: user?.token,
        onMessage: (msg) => {
            if (!msg) return;
            if (msg.type === "activity" || msg.type === "activity_new") {
                setActivities((prev) => [msg.activity, ...prev]);
            }
        },
        reconnect: true,
    });

    // Frontend filtering
    const filteredActivities = useMemo(() => {
        if (!searchTerm.trim()) return activities;
        const term = searchTerm.toLowerCase();
        return activities.filter((a) => {
            const actor = a.actor?.email?.toLowerCase() || "";
            const role = a.actor?.role?.toLowerCase() || "";
            const text = `${a.action_type || a.verb || ""} ${a.model_name || ""}`.toLowerCase();
            return actor.includes(term) || role.includes(term) || text.includes(term);
        });
    }, [activities, searchTerm]);

    // Group activities by date range
    const groupedActivities = useMemo(() => {
        const groups = { Today: [], Yesterday: [], "This Week": [], "This Month": [], Older: [] };
        const now = new Date();

        const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        filteredActivities.forEach((a) => {
            const date = new Date(a.timestamp || a.created_at);
            const diffDays = Math.floor((startOfDay(now) - startOfDay(date)) / 86400000);

            if (diffDays === 0) groups.Today.push(a);
            else if (diffDays === 1) groups.Yesterday.push(a);
            else if (date >= startOfWeek) groups["This Week"].push(a);
            else if (date >= startOfMonth) groups["This Month"].push(a);
            else groups.Older.push(a);
        });

        return groups;
    }, [filteredActivities]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchPage(next);
    };

    // Component
    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-3 felx justify-content-between align-items-center d-flex">
                <span>
                    <h3 className="mb-1 fw-semibold">Activity Feed</h3>
                    <p className="text-muted mb-3">
                        View and filter all recent business activities.
                    </p>
                </span>
                {/* Search */}
                <InputGroup className="mb-3" style={{ maxWidth: 400 }}>

                    <Form.Control
                        type="text"
                        placeholder="Search by email, role, or activity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <InputGroup.Text className="bg-light">
                        <i className="fa-solid fa-search text-muted"></i>
                    </InputGroup.Text>
                </InputGroup>
            </div>



            {/* Main Card */}
            <Card className="shadow-sm border-0 fade-in">
                <Card.Body
                    ref={listRef}
                    style={{
                        maxHeight: "480px",
                        overflowY: "auto",
                        padding: "1rem",
                        backgroundColor: "#fff",
                    }}
                >
                    {/* Loading */}
                    {loading && activities.length === 0 && (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-3">Loading recent activities...</p>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && activities.length === 0 && (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-1 mb-2"></i>
                            <p>No activities yet. Stay tuned!</p>
                        </div>
                    )}

                    {/* Grouped List */}
                    {Object.entries(groupedActivities).map(
                        ([label, group]) =>
                            group.length > 0 && (
                                <div key={label} className="mb-4">
                                    <h6 className="text-primary fw-semibold mb-2">{label}</h6>
                                    <ListGroup variant="flush">
                                        {group.map((a) => (
                                            <ListGroup.Item
                                                key={a.id}
                                                className="border-0 border-start border-3 border-primary-subtle mb-2 shadow-sm activity-item"
                                                style={{
                                                    backgroundColor: "#fff",
                                                    borderRadius: "0.5rem",
                                                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong className="text-dark">
                                                            {a.action_type || a.verb || "Activity"}
                                                        </strong>
                                                        <span className="text-muted ms-1">
                                                            — {a.model_name || ""}{" "}
                                                            {a.object_id ? `#${a.object_id}` : ""}
                                                        </span>
                                                    </div>
                                                    <small className="text-muted">
                                                        {new Date(a.timestamp || a.created_at).toLocaleString()}
                                                    </small>
                                                </div>
                                                <div className="mt-1 text-secondary" style={{ fontSize: "0.9rem" }}>
                                                    {a.actor ? (
                                                        <>
                                                            {a.actor.email || "System"}{" "}
                                                            <span className="text-muted">
                                                                ({a.actor.role || ""})
                                                            </span>
                                                        </>
                                                    ) : (
                                                        "System"
                                                    )}
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            )
                    )}
                </Card.Body>
            </Card>

            {/* Load More */}
            <div className="text-center my-3">
                {hasMore ? (
                    <Button
                        onClick={loadMore}
                        disabled={loading}
                        variant="outline-primary"
                        className="px-4 py-2 rounded-pill shadow-sm"
                    >
                        {loading ? "Loading..." : "Load More"}
                    </Button>
                ) : (
                    !loading && (
                        <div className="text-muted small mt-2">No more activities</div>
                    )
                )}
            </div>
        </div>
    );
}
