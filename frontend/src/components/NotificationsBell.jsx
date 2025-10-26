// src/components/NotificationsBell.jsx
import { Dropdown, Badge,ListGroup } from "react-bootstrap";
import useNotifications from "../hooks/useNotifications";

// helper for "time ago" formatting
function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const NotificationsBell = () => {
    const { notifications, unread, markRead } = useNotifications();

    return (
        <Dropdown>
            <Dropdown.Toggle id="dropdown-notifications" variant="link" className="nav-link" >
                🔔 {unread > 0 && <Badge bg="danger">{unread}</Badge>}
            </Dropdown.Toggle>

            <Dropdown.Menu align="end" className="shadow-sm border-0" style={{ minWidth: 320, maxHeight: 320, overflowY: "auto", borderRadius: "0.75rem", }}>
                {notifications.length === 0 ? (
                    <div className="text-center p-3 text-muted">
                        <div style={{ fontSize: "1.5rem" }}>🔕</div>
                        <div className="mt-1 fw-semibold">You’re all caught up!</div>
                        <small>No new notifications</small>
                    </div>
                ) : (
                    <ListGroup variant="flush">
                        {notifications.map((n) => (
                            <ListGroup.Item
                                key={n.id}
                                action
                                onClick={() => markRead(n.id)}
                                className={`d-flex justify-content-between align-items-start ${!n.is_read ? "bg-light" : ""
                                    }`}
                            >
                                <div className="flex-grow-1">
                                    <div
                                        className="fw-semibold"
                                        style={{
                                            fontWeight: n.is_read ? "normal" : "600",
                                            color: n.is_read ? "#555" : "#000",
                                        }}
                                    >
                                        {n.verb}
                                    </div>
                                    <small className="text-muted">{timeAgo(n.created_at)}</small>
                                </div>
                                {!n.is_read && (
                                    <span
                                        role="button"
                                        className="text-success ms-2"
                                        style={{
                                            cursor: "pointer",
                                            opacity: 0.7,
                                            fontSize: "1rem",
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markRead(n.id);
                                        }}
                                    >
                                        <i class="fa-regular fa-circle-check"></i>
                                  </span>
                                )}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default NotificationsBell;