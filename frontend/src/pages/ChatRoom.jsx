// src/pages/ChatRoom.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import API from "../api/api";
import useWebSocket from "../hooks/useWebSocket";
import usePresence from "../hooks/usePresence";
import { ListGroup, Form, Button, InputGroup } from "react-bootstrap";

export default function ChatRoom({businessId}) {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");
    const [page, setPage] = useState(1);
    const messagesRef = useRef(null);
    const onlineUsers = usePresence(businessId);

    const fetchMessages = async (p = 1) => {
        setLoading(true);
        try {
            const res = await API.get(`/businesses/${user.business_id}/chat/messages/?page=${p}&page_size=15`);
            const data = res.data.results || res.data;
            setMessages((prev) => (p === 1 ? data : [...prev, ...data]));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchMessages(1);
    }, [user]);

    const { send } = useWebSocket({
        url: `/ws/business/${user?.business_id}/chat/`,
        token: user?.token,
        onMessage: (msg) => {
            if (msg.type === "chat_message") {
                setMessages((p) => [msg.message, ...p]);
            }
        },
    });

    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        send({ type: "message", content: text });
        setText("");
    };

    return (
        <div>
            <div className="chat-sidebar">
                <h5>Online Users</h5>
                <ul>
                    {onlineUsers.map(u => (
                        <li key={u.id}>
                            {u.email} <span style={{ color: "green" }}>●</span>
                        </li>
                    ))}
                </ul>
            </div>
            <h3>Business Chat</h3>
            <div style={{ maxHeight: 400, overflow: "auto" }} ref={messagesRef}>
                <ListGroup>
                    {messages.map((m) => (
                        <ListGroup.Item key={m.id}>
                            <div><strong>{m.sender?.email}</strong> <small className="text-muted">{new Date(m.created_at).toLocaleString()}</small></div>
                            <div>{m.content}</div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>

            <Form onSubmit={handleSend} className="mt-2">
                <InputGroup>
                    <Form.Control value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
                    <Button type="submit">Send</Button>
                </InputGroup>
            </Form>
        </div>
    );
}
