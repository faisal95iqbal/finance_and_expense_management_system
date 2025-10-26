/* 
// src/pages/BusinessSettingsPage.jsx
import React, { useEffect, useState, useContext } from "react";
import {
    Container,
    Card,
    Button,
    Table,
    Modal,
    Form,
    Spinner,
    Row,
    Col,
    Badge,
    OverlayTrigger,
    Tooltip,
    Toast,
    ToastContainer,
    InputGroup
} from "react-bootstrap";
import API from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

function InviteModal({ show, onHide, onInvite }) {
    const [data, setData] = useState({ email: "", role: "staff", phone: "" });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!show) setData({ email: "", role: "staff", phone: "" });
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onInvite(data);
            onHide();
        } catch (err) {
            alert("Invite failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Invite User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-2">
                        <Form.Label>Email</Form.Label>
                        <Form.Control required type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Role</Form.Label>
                        <Form.Select value={data.role} onChange={(e) => setData({ ...data, role: e.target.value })}>
                            <option value="staff">Staff</option>
                            <option value="accountant">Accountant</option>
                            <option value="manager">Manager</option>
                            <option value="owner">Owner</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Phone (optional)</Form.Label>
                        <Form.Control value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>{submitting ? "Inviting..." : "Invite"}</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default function BusinessSettings() {
    const { user } = useContext(AuthContext);
    const [business, setBusiness] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);

    // edit business modal
    const [showEdit, setShowEdit] = useState(false);
    const [editData, setEditData] = useState({ name: "", address: "", phone: "", timezone: "UTC" });
    const [saving, setSaving] = useState(false);

    const fetchBusinessAndUsers = async () => {
        if (!user || !user.business_id) return;
        setLoading(true);
        try {
            const [bRes, uRes] = await Promise.all([
                API.get(`/businesses/${user.business_id}/`),                
                API.get(`/businesses/${user.business_id}/users/`),
              ]);
            setBusiness(bRes.data);
            setUsers(uRes.data);
            setEditData({
                name: bRes.data.name || "",
                address: bRes.data.address || "",
                phone: bRes.data.phone || "",
                timezone: bRes.data.timezone || "UTC",
            });
        } catch (err) {
            console.error(err);
            alert("Failed to load business data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchBusinessAndUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleInvite = async ({ email, role, phone }) => {
        // business-scoped create
        await API.post(`/businesses/${user.business_id}/users/`, { email, role, phone });
        await fetchBusinessAndUsers();
    };

    const handleMarkInactive = async (userId) => {
        if (!window.confirm("Mark user inactive?")) return;
        try {
            // mark inactive via PATCH to user's business-scoped endpoint
            await API.patch(`/businesses/${user.business_id}/users/${userId}/`, { is_active: false });
            await fetchBusinessAndUsers();
        } catch (err) {
            console.error(err);
            alert("Failed to mark inactive");
        }
    };

    const handleResend = async (userId) => {
        try {
            await API.post(`/businesses/${user.business_id}/users/${userId}/resend_invite/`);
            alert("Invitation resent");
        } catch (err) {
            console.error(err);
            alert("Failed to resend invite");
        }
    };

    const handleEditBusiness = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.patch(`/businesses/${user.business_id}/`, editData);
            setShowEdit(false);
            fetchBusinessAndUsers();
        } catch (err) {
            console.error(err);
            alert("Failed to update business");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spinner animation="border" />;

    if (!business) return <div className="p-4">No business found</div>;

    return (
        <div className="p-4">
            <h2>Business Settings</h2>

            <div className="mb-3">
                <strong>{business.name}</strong> &nbsp;
                <Button size="sm" onClick={() => setShowEdit(true)}>Edit Business</Button>
            </div>

            <h4>Users</h4>
            <div className="mb-2">
                <Button onClick={() => setShowInvite(true)}>Invite user</Button>
            </div>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>{u.phone || "-"}</td>
                            <td>{u.is_active ? "Yes" : "No"}</td>
                            <td>
                                {!u.is_active && <Button size="sm" variant="info" onClick={() => handleResend(u.id)}>Resend Invite</Button>}{" "}
                                {user.role === "owner" || user.role === "manager" ? (
                                    <Button size="sm" variant="warning" onClick={() => handleMarkInactive(u.id)}>Mark Inactive</Button>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <InviteModal show={showInvite} onHide={() => setShowInvite(false)} onInvite={handleInvite} />

            <Modal show={showEdit} onHide={() => setShowEdit(false)}>
                <Form onSubmit={handleEditBusiness}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Business</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-2">
                            <Form.Label>Name</Form.Label>
                            <Form.Control required value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Address</Form.Label>
                            <Form.Control value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Timezone</Form.Label>
                            <Form.Control value={editData.timezone} onChange={(e) => setEditData({ ...editData, timezone: e.target.value })} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
*/
import React, { useEffect, useState, useContext, useCallback,useMemo } from "react";
import {
    Container,
    Card,
    Button,
    Table,
    Modal,
    Form,
    Spinner,
    Row,
    Col,
    Badge,
    OverlayTrigger,
    Tooltip,
    Toast,
    ToastContainer,
    InputGroup
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import './BusinessSettings.css';

function ToastMessage({ show, onClose, title, message, variant = "primary" }) {
    // variant currently unused but kept for future color mapping
    return (
        <Toast onClose={onClose} show={show} delay={4000} autohide>
            <Toast.Header>
                <strong className="me-auto">{title}</strong>
            </Toast.Header>
            <Toast.Body>{message}</Toast.Body>
        </Toast>
    );
}

function InviteModal({ show, onHide, onInvite }) {
    const [data, setData] = useState({ email: "", role: "staff", phone: "" });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!show) setData({ email: "", role: "staff", phone: "" });
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onInvite(data);
            onHide();
        } catch (err) {
            // bubble error up (caller will show toast)
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Invite User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3" controlId="inviteEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            required
                            type="email"
                            placeholder="user@example.com"
                            value={data.email}
                            onChange={(e) => setData({ ...data, email: e.target.value })}
                            autoFocus
                        />
                        <Form.Text muted>We'll send an invite link to this address.</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="inviteRole">
                        <Form.Label>Role</Form.Label>
                        <Form.Select
                            value={data.role}
                            onChange={(e) => setData({ ...data, role: e.target.value })}
                        >
                            <option value="staff">Staff</option>
                            <option value="accountant">Accountant</option>
                            <option value="manager">Manager</option>
                            <option value="owner">Owner</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-0" controlId="invitePhone">
                        <Form.Label>Phone (optional)</Form.Label>
                        <Form.Control
                            placeholder="+92 3xx xxxxxxx"
                            value={data.phone}
                            onChange={(e) => setData({ ...data, phone: e.target.value })}
                        />
                        <Form.Text muted>Optional: phone for quicker contact.</Form.Text>
                    </Form.Group>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={onHide} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />{" "}
                                Inviting...
                            </>
                        ) : (
                            "Invite"
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

function EditBusinessModal({ show, onHide, data, onChange, onSave, saving }) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={onSave}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Business</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3" controlId="bizName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                            required
                            placeholder="Your business name"
                            value={data.name}
                            onChange={(e) => onChange({ ...data, name: e.target.value })}
                            autoFocus
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="bizAddress">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                            placeholder="Office address (optional)"
                            value={data.address}
                            onChange={(e) => onChange({ ...data, address: e.target.value })}
                        />
                    </Form.Group>

                    <Row className="g-2">
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="bizPhone">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control
                                    placeholder="+92 3xx xxxxxxx"
                                    value={data.phone}
                                    onChange={(e) => onChange({ ...data, phone: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="bizTimezone">
                                <Form.Label>Timezone</Form.Label>
                                <Form.Control
                                    placeholder="UTC"
                                    value={data.timezone}
                                    onChange={(e) => onChange({ ...data, timezone: e.target.value })}
                                />
                                <Form.Text muted>e.g. UTC, Asia/Karachi</Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />{" "}
                                Saving...
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default function BusinessSettings() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [business, setBusiness] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showInvite, setShowInvite] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    const [editData, setEditData] = useState({
        name: "",
        address: "",
        phone: "",
        timezone: "UTC"
    });
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const term = searchTerm.toLowerCase();
        return users.filter(
            (u) =>
                (u.email && u.email.toLowerCase().includes(term)) ||
                (u.role && u.role.toLowerCase().includes(term))
        );
    }, [users, searchTerm]);

    // Toasts
    const [toast, setToast] = useState({ show: false, title: "", message: "" });

    // API error / action pending states
    const [invitePending, setInvitePending] = useState(false);
    const [actionPending, setActionPending] = useState({}); // keyed by userId for per-row actions

    const showToast = (title, message) => setToast({ show: true, title, message });
    const hideToast = () => setToast({ ...toast, show: false });

    const fetchBusinessAndUsers = useCallback(async () => {
        if (!user || !user.business_id) return;
        setLoading(true);
        try {
            const [bRes, uRes] = await Promise.all([
                API.get(`/businesses/${user.business_id}/`),
                API.get(`/businesses/${user.business_id}/users/`)
            ]);
            setBusiness(bRes.data);
            setUsers(uRes.data || []);
            setEditData({
                name: bRes.data.name || "",
                address: bRes.data.address || "",
                phone: bRes.data.phone || "",
                timezone: bRes.data.timezone || "UTC"
            });
        } catch (err) {
            console.error("fetchBusinessAndUsers:", err);
            showToast("Error", "Failed to load business data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchBusinessAndUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleInvite = async ({ email, role, phone }) => {
        if (!user || !user.business_id) return;
        setInvitePending(true);
        try {
            await API.post(`/businesses/${user.business_id}/users/`, { email, role, phone });
            showToast("Success", "Invitation sent.");
            await fetchBusinessAndUsers();
        } catch (err) {
            console.error("handleInvite:", err);
            showToast("Error", "Failed to send invite. Please check the email and try again.");
            throw err;
        } finally {
            setInvitePending(false);
        }
    };

    const handleMarkInactive = async (userId) => {
        if (!window.confirm("Mark user inactive?")) return;
        setActionPending((p) => ({ ...p, [userId]: true }));
        try {
            await API.patch(`/businesses/${user.business_id}/users/${userId}/`, { is_active: false });
            showToast("Success", "User marked inactive.");
            await fetchBusinessAndUsers();
        } catch (err) {
            console.error("handleMarkInactive:", err);
            showToast("Error", "Failed to mark user inactive.");
        } finally {
            setActionPending((p) => ({ ...p, [userId]: false }));
        }
    };

    const handleResend = async (userId) => {
        setActionPending((p) => ({ ...p, [userId]: true }));
        try {
            await API.post(`/businesses/${user.business_id}/users/${userId}/resend_invite/`);
            showToast("Success", "Invitation resent.");
        } catch (err) {
            console.error("handleResend:", err);
            showToast("Error", "Failed to resend invite.");
        } finally {
            setActionPending((p) => ({ ...p, [userId]: false }));
        }
    };

    const handleEditBusiness = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.patch(`/businesses/${user.business_id}/`, editData);
            setShowEdit(false);
            showToast("Success", "Business updated.");
            await fetchBusinessAndUsers();
        } catch (err) {
            console.error("handleEditBusiness:", err);
            showToast("Error", "Failed to update business.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-80">
                <Spinner animation="border" variant="primary" role="status" />
            </div>
        );
    }

    if (!business) {
        return (
            <Container className="py-5">
                <Card className="shadow-sm p-4 text-center">
                    <Card.Body>
                        <h5>No business found</h5>
                        <p className="text-muted">It seems you are not assigned to a business yet.</p>
                        <Button variant="primary" onClick={() => navigate('/')}>Go Home</Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }
    

    return (
        <Container fluid className="p-4">
            

            {/* Business card */}
            <Card className="shadow-sm mb-4 border-0">
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <h2 className="mb-0 text-primary fw-semibold">Business Details</h2>
                            <br />
                            <h5 className="mb-1">Name: {business.name}</h5>
                            <div className="text-muted small text-truncate" style={{ maxWidth: '60%' }}>
                                <strong>Address: </strong>  {business.address || "No address set"}
                            </div>
                            <div className="mt-2 small">
                                <span className="me-3"><strong>Phone:</strong> {business.phone || "-"}</span>
                                <span><strong>Timezone:</strong> {business.timezone || "UTC"}</span>
                            </div>
                        </Col>
                        <Col md={4} className="text-md-end mt-3 mt-md-0">
                            <Badge bg="secondary" className="me-2">ID: {business.id}</Badge>
                            <Badge bg="info">{business.industry || "General"}</Badge>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            {/* Header banner */}
            <div className="mb-4 p-3 bg-white shadow-sm rounded-3 page-header">
                <Row className="align-items-center">
                    <Col md>
                        <h2 className="mb-0 text-primary fw-semibold">Business Settings</h2>
                        <p className="text-muted small mb-0">
                            Manage business details, invite team members and control team access.
                        </p>
                    </Col>
                    <Col md="auto" className="mt-3 mt-md-0">
                        <div className="d-flex gap-2">
                            <Button variant="outline-primary" onClick={() => setShowEdit(true)}>
                                Edit Business
                            </Button>
                            <Button variant="primary" onClick={() => setShowInvite(true)}>
                                + Invite User
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Users table */}
            <Card className="shadow-sm border-0">
                <Card.Body>
                    
                    {/* 🔍 Search Input */}
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <Card.Title className="mb-3">Team Members</Card.Title>
                        <InputGroup style={{ maxWidth: "300px" }}>
                            
                            <Form.Control
                                type="text"
                                placeholder="Search by email or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <InputGroup.Text>
                                <i className="fa-solid fa-search"></i>
                            </InputGroup.Text>
                        </InputGroup>
                    </div>
                    <div className="table-responsive">
                        <Table hover bordered responsive className="align-middle mb-0">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '200px' }}>Email</th>
                                    <th>Role</th>
                                    <th>Phone</th>
                                    <th>Active</th>
                                    <th style={{ minWidth: '180px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted py-4">
                                            No users yet. Invite someone to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id}>
                                            <td style={{ maxWidth: 240 }}>
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={<Tooltip id={`email-tip-${u.id}`}>{u.email}</Tooltip>}
                                                >
                                                    <div className="text-truncate fw-semibold">{u.email}</div>
                                                </OverlayTrigger>
                                                <div className="small text-muted text-truncate">
                                                    {u.name || "—"}
                                                </div>
                                            </td>

                                            <td>
                                                <span className="text-capitalize">{u.role}</span>
                                                {u.role === "owner" && <Badge bg="primary" className="ms-2">Owner</Badge>}
                                            </td>

                                            <td style={{ maxWidth: 140 }}>
                                                <div className="text-truncate">{u.phone || "-"}</div>
                                            </td>

                                            <td>
                                                {u.is_active ? (
                                                    <Badge bg="success">Active</Badge>
                                                ) : (
                                                    <Badge bg="secondary">Invited</Badge>
                                                )}
                                            </td>

                                            <td>
                                                <div className="d-flex gap-2">
                                                    {!u.is_active && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline-info"
                                                            disabled={!!actionPending[u.id]}
                                                            onClick={() => handleResend(u.id)}
                                                        >
                                                            {actionPending[u.id] ? (
                                                                <Spinner as="span" animation="border" size="sm" />
                                                            ) : (
                                                                "Resend Invite"
                                                            )}
                                                        </Button>
                                                    )}

                                                    {(user.role === "owner" || user.role === "manager") && u.is_active && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline-warning"
                                                            disabled={!!actionPending[u.id]}
                                                            onClick={() => handleMarkInactive(u.id)}
                                                        >
                                                            {actionPending[u.id] ? (
                                                                <Spinner as="span" animation="border" size="sm" />
                                                            ) : (
                                                                "Mark Inactive"
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Modals */}
            <InviteModal
                show={showInvite}
                onHide={() => setShowInvite(false)}
                onInvite={handleInvite}
            />

            <EditBusinessModal
                show={showEdit}
                onHide={() => setShowEdit(false)}
                data={editData}
                onChange={setEditData}
                onSave={handleEditBusiness}
                saving={saving}
            />

            {/* Toasts */}
            <ToastContainer position="top-end" className="p-3">
                <Toast onClose={hideToast} show={toast.show} delay={4000} autohide>
                    <Toast.Header>
                        <strong className="me-auto">{toast.title}</strong>
                    </Toast.Header>
                    <Toast.Body>{toast.message}</Toast.Body>
                </Toast>
            </ToastContainer>
        </Container>
    );
}
