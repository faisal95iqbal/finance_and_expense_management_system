// src/pages/AdminBusinessesPage.jsx
import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Spinner } from "react-bootstrap";
import API from "../api/api";

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  // create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ name: "", address: "", phone: "", timezone: "UTC", owner_email: "", owner_password: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await API.get("/businesses/");
      setBusinesses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post("/businesses/", createData);
      setShowCreate(false);
      setCreateData({ name: "", address: "", phone: "", timezone: "UTC", owner_email: "", owner_password: "" });
      fetchBusinesses();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data || "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Mark this business inactive? This will mark all business users inactive.")) return;
    try {
      await API.delete(`/businesses/${id}/`);
      fetchBusinesses();
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate business");
    }
  };

  const handleReactivate = async (id) => {
    try {
      await API.post(`/businesses/${id}/reactivate/`);
      fetchBusinesses();
    } catch (err) {
      console.error(err);
      alert("Failed to reactivate business");
    }
  };

  return (
    <div className="p-4">
      <h2>Businesses (Admin)</h2>
      <div className="mb-3">
        <Button onClick={() => setShowCreate(true)}>Create Business + Owner</Button>
      </div>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Timezone</th>
              <th>Active</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.name}</td>
                <td>{b.phone}</td>
                <td>{b.timezone}</td>
                <td>{b.is_active ? "Yes" : "No"}</td>
                <td>{new Date(b.created_at).toLocaleString()}</td>
                <td>
                  {b.is_active ? (
                    <Button variant="danger" size="sm" onClick={() => handleSoftDelete(b.id)}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button variant="success" size="sm" onClick={() => handleReactivate(b.id)}>
                      Reactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showCreate} onHide={() => setShowCreate(false)}>
        <Form onSubmit={handleCreate}>
          <Modal.Header closeButton>
            <Modal.Title>Create Business + Owner</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Business name</Form.Label>
              <Form.Control required value={createData.name} onChange={(e) => setCreateData({ ...createData, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address</Form.Label>
              <Form.Control value={createData.address} onChange={(e) => setCreateData({ ...createData, address: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={createData.phone} onChange={(e) => setCreateData({ ...createData, phone: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Timezone</Form.Label>
              <Form.Control value={createData.timezone} onChange={(e) => setCreateData({ ...createData, timezone: e.target.value })} />
            </Form.Group>

            <hr />
            <h6>Owner account</h6>
            <Form.Group className="mb-2">
              <Form.Label>Owner Email</Form.Label>
              <Form.Control required type="email" value={createData.owner_email} onChange={(e) => setCreateData({ ...createData, owner_email: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Owner Password</Form.Label>
              <Form.Control required type="password" value={createData.owner_password} onChange={(e) => setCreateData({ ...createData, owner_password: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
