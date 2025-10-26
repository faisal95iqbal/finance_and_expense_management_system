{/*
// src/pages/ChatRoom.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import API from "../api/api";
import useWebSocket from "../hooks/useWebSocket";
import usePresence from "../hooks/usePresence";
import { ListGroup, Form, Button, InputGroup, Spinner } from "react-bootstrap";

export default function ChatRoom({ businessId: propBusinessId }) {
    const { user } = useContext(AuthContext);
    const businessId = propBusinessId || user?.business_id;
    const [messages, setMessages] = useState([]); // oldest -> newest
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [text, setText] = useState("");
    const [page, setPage] = useState(1); // pagination page (1 = newest page returned by API)
    const [hasMore, setHasMore] = useState(true);
    const containerRef = useRef(null);

    const { onlineUsers, loading: presenceLoading } = usePresence(user?.business_id);

    // fetch messages: API returns newest-first (your model used ordering "-created_at"),
    // so we reverse results to show oldest->newest in the UI.
    const fetchMessages = async (p = 1) => {
        if (!businessId) return;
        setLoading(true);
        try {
            const res = await API.get(`/businesses/${businessId}/chat/messages/?page=${p}&page_size=15`);
            const data = res.data.results || res.data || [];
            // API returns newest-first; to display oldest->newest, reverse order
            const pageMessages = Array.isArray(data) ? data.slice().reverse() : [];
            if (p === 1) {
                setMessages(pageMessages);
                // scroll to bottom after initial load
                setTimeout(() => {
                    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
                }, 50);
            } else {
                // older messages: prepend to front
                setMessages((prev) => [...pageMessages, ...prev]);
            }
            setHasMore(Boolean(res.data.next)); // uses DRF pagination next link
        } catch (err) {
            console.error("Failed to load messages", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!businessId) return;
        fetchMessages(1);
    }, [businessId]);

    // websocket for chat
    const { send } = useWebSocket({
        url: businessId ? `/ws/business/${businessId}/chat/` : null,
        token: user?.token,
        onMessage: (msg) => {
            if (!msg) return;
            if (msg.type === "chat_message") {
                // msg.message is the serialized chat message (consistent with backend)
                setMessages((prev) => [...prev, msg.message]);
                // auto-scroll to bottom
                setTimeout(() => {
                    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
                }, 50);
            }
        },
        reconnect: true,
    });

    const handleSend = async (e) => {
        e?.preventDefault?.();
        const content = (text || "").trim();
        if (!content) return;
        try {
            setSending(true);
            // send via websocket; backend consumer persists message and broadcasts
            send({ type: "message", content });
            setText("");
        } catch (err) {
            console.error("Send failed", err);
            alert("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    // Load older messages when scrolling to top
    const handleScroll = (e) => {
        const el = e.target;
        if (!el) return;
        if (el.scrollTop === 0 && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            // store previous scroll height to maintain scroll position
            const prevHeight = el.scrollHeight;
            fetchMessages(nextPage).then(() => {
                // maintain scroll offset after prepend
                setTimeout(() => {
                    el.scrollTop = el.scrollHeight - prevHeight;
                }, 40);
            });
        }
    };

    return (
        <div className="d-flex gap-3">
            <div style={{ minWidth: 240, maxWidth: 320 }}>
                <h6>Online Users</h6>
                <div>
                    {onlineUsers.length === 0 ? <div className="text-muted">No one online</div> : (
                        <ul className="list-unstyled">
                            {onlineUsers.map((u) => (
                                <li key={u.id}>
                                    {u.email} <span aria-hidden="true" style={{ color: "green" }}>●</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div style={{ flex: 1 }}>
                <h5>Business Chat</h5>
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    style={{ maxHeight: 420, overflowY: "auto", border: "1px solid #e9ecef", padding: 8 }}
                >
                    {loading && messages.length === 0 ? (
                        <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
                    ) : (
                        <ListGroup variant="flush">
                            {messages.map((m) => (
                                <ListGroup.Item key={m.id}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <strong>{m.sender?.email || "Unknown"}</strong>
                                        <small className="text-muted">{new Date(m.created_at).toLocaleString()}</small>
                                    </div>
                                    <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                    {hasMore && <div className="text-center py-1 text-muted">Scroll up to load older messages</div>}
                </div>

                <Form onSubmit={handleSend} className="mt-2">
                    <InputGroup>
                        <Form.Control
                            placeholder="Type a message..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <Button type="submit" disabled={sending || !text.trim()}>
                            {sending ? "Sending..." : "Send"}
                        </Button>
                    </InputGroup>
                </Form>
            </div>
        </div>
    );
}
*/}

import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import API from "../api/api";
import useWebSocket from "../hooks/useWebSocket";
import usePresence from "../hooks/usePresence";
import {
    ListGroup,
    Form,
    Button,
    InputGroup,
    Spinner,
    Card,
    Badge,
} from "react-bootstrap";

export default function ChatRoom({ businessId: propBusinessId }) {
    const { user } = useContext(AuthContext);
    const businessId = propBusinessId || user?.business_id;

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [text, setText] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const containerRef = useRef(null);
    const { onlineUsers } = usePresence(user?.business_id);

    // Fetch chat messages (oldest → newest)
    const fetchMessages = async (p = 1) => {
        if (!businessId) return;
        setLoading(true);
        try {
            const res = await API.get(
                `/businesses/${businessId}/chat/messages/?page=${p}&page_size=15`
            );
            const data = res.data.results || res.data || [];
            const pageMessages = Array.isArray(data) ? data.slice().reverse() : [];
            if (p === 1) {
                setMessages(pageMessages);
                setTimeout(() => {
                    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
                }, 50);
            } else {
                setMessages((prev) => [...pageMessages, ...prev]);
            }
            setHasMore(Boolean(res.data.next));
        } catch (err) {
            console.error("Failed to load messages", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!businessId) return;
        fetchMessages(1);
    }, [businessId]);

    // WebSocket for real-time chat
    const { send } = useWebSocket({
        url: businessId ? `/ws/business/${businessId}/chat/` : null,
        token: user?.token,
        onMessage: (msg) => {
            if (!msg) return;
            if (msg.type === "chat_message") {
                setMessages((prev) => [...prev, msg.message]);
                setTimeout(() => {
                    containerRef.current?.scrollTo(
                        0,
                        containerRef.current.scrollHeight
                    );
                }, 50);
            }
        },
        reconnect: true,
    });

    // Send message
    const handleSend = async (e) => {
        e?.preventDefault?.();
        const content = text.trim();
        if (!content) return;
        try {
            setSending(true);
            send({ type: "message", content });
            setText("");
        } catch (err) {
            console.error("Send failed", err);
            alert("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    // Load older messages when scrolling to top
    const handleScroll = (e) => {
        const el = e.target;
        if (!el) return;
        if (el.scrollTop === 0 && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            const prevHeight = el.scrollHeight;
            fetchMessages(nextPage).then(() => {
                setTimeout(() => {
                    el.scrollTop = el.scrollHeight - prevHeight;
                }, 40);
            });
        }
    };

    return (
        <div className="chat-container d-flex flex-column flex-md-row gap-3">
            {/* Online Users Sidebar */}
            <Card className="chat-sidebar shadow-sm p-3 mb-3 mb-md-0">
                <h6 className="fw-bold text-primary mb-3">Online Users</h6>
                {onlineUsers.length === 0 ? (
                    <div className="text-muted small">No one online</div>
                ) : (
                    <ul className="list-unstyled m-0">
                        {onlineUsers.map((u) => (
                            <li
                                key={u.id}
                                className="d-flex align-items-center mb-2 bg-light rounded p-2"
                            >
                                <div
                                    className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center me-2"
                                    style={{ width: 32, height: 32, fontSize: 14 }}
                                >
                                    {u.email?.charAt(0).toUpperCase()}
                                </div>
                                <span
                                    className="text-truncate"
                                    style={{ maxWidth: "140px", fontSize: "0.9rem" }}
                                    title={u.email}
                                >
                                    {u.email}
                                </span>
                                <Badge
                                    bg="success"
                                    className="ms-auto"
                                    pill
                                    style={{ fontSize: "0.65rem" }}
                                >
                                    Online
                                </Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            {/* Main Chat Section */}
            <Card className="chat-main flex-grow-1 shadow-sm p-3 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-semibold mb-0 text-primary">Business Chat</h5>
                    <small className="text-muted">
                        {messages.length} messages total
                    </small>
                </div>

                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="chat-messages flex-grow-1 border rounded p-2"
                    style={{
                        overflowY: "auto",
                        scrollBehavior: "smooth",
                        maxHeight: "60vh",
                        backgroundColor: "#fafafa",
                    }}
                >
                    {loading && messages.length === 0 ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" size="sm" />
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            {messages.map((m) => {
                                const isOwn = m.sender?.id === user.id;
                                return (
                                    <div
                                        key={m.id}
                                        className={`p-2 px-3 rounded-3 shadow-sm ${isOwn
                                                ? "bg-primary text-white align-self-end"
                                                : "bg-light align-self-start"
                                            }`}
                                        style={{
                                            maxWidth: "75%",
                                            borderRadius: "1rem",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        <div
                                            className={`fw-semibold small mb-1 ${isOwn ? "text-white-50" : "text-muted"
                                                }`}
                                        >
                                            {m.sender?.email || "Unknown"}
                                        </div>
                                        <div>{m.content}</div>
                                        <div
                                            className={`text-end mt-1 small ${isOwn ? "text-white-50" : "text-muted"
                                                }`}
                                        >
                                            {new Date(m.created_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {hasMore && !loading && (
                        <div className="text-center text-muted small py-1">
                            Scroll up to load older messages
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <Form onSubmit={handleSend} className="chat-input mt-3">
                    <InputGroup>
                        <Form.Control
                            placeholder="Type a message..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            disabled={sending || !text.trim()}
                            variant="primary"
                            style={{
                                transition: "all 0.2s ease",
                                transform: sending ? "scale(0.95)" : "scale(1)",
                            }}
                        >
                            {sending ? (
                                <Spinner animation="border" size="sm" />
                            ) : (
                                <i className="fa-solid fa-paper-plane"></i>
                            )}
                        </Button>
                    </InputGroup>
                </Form>
            </Card>
        </div>
    );
}
