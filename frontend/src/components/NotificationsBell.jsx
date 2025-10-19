// src/components/NotificationsBell.jsx
import { Dropdown, Badge } from "react-bootstrap";
import useNotifications from "../hooks/useNotifications";

const NotificationsBell = () => {
    const { notifications, unread, markRead } = useNotifications();

    return (
        <Dropdown>
            <Dropdown.Toggle variant="light" id="dropdown-notifications">
                🔔 {unread > 0 && <Badge bg="danger">{unread}</Badge>}
            </Dropdown.Toggle>

            <Dropdown.Menu align="end" style={{ minWidth: 320 }}>
                {notifications.length === 0 && <div className="p-2">No notifications</div>}
                {notifications.map((n) => (
                    <div key={n.id} className="dropdown-item d-flex justify-content-between align-items-start">
                        <div>
                            <div style={{ fontWeight: n.is_read ? "normal" : "600" }}>{n.verb}</div>
                            <small className="text-muted">{new Date(n.created_at).toLocaleString()}</small>
                        </div>
                        {!n.is_read && (
                            <button className="btn btn-sm btn-link" onClick={() => markRead(n.id)}>Mark</button>
                        )}
                    </div>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default NotificationsBell;