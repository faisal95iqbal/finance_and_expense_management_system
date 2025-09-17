// src/pages/BusinessSettingsPage.jsx
import React, { useEffect, useState, useContext } from "react";
import { Button, Table, Modal, Form, Spinner } from "react-bootstrap";
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
