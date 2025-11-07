{/*
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
*/}

// src/pages/AdminBusinessesPage.jsx
import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Spinner,
  Container,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import API from "../api/api";
import {toast} from "react-toastify";

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    name: "",
    address: "",
    phone: "",
    timezone: "UTC",
    owner_email: "",
    owner_password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Confirm Modal (for deactivate/reactivate)
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    action: null,
    businessId: null,
    message: "",
  });


  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await API.get("/businesses/");
      setBusinesses(res.data);
    } catch (err) {
      toast.error("Failed to fetch businesses");
      
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
      setCreateData({
        name: "",
        address: "",
        phone: "",
        timezone: "UTC",
        owner_email: "",
        owner_password: "",
      });
      fetchBusinesses();
      toast.success("Business created successfully");
    } catch (err) {
      toast.error("Failed to create business. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmAction = (id, actionType) => {
    const isDeactivate = actionType === "deactivate";
    setConfirmModal({
      show: true,
      action: isDeactivate ? "deactivate" : "reactivate",
      businessId: id,
      message: isDeactivate
        ? "Mark this business inactive? This will mark all its users inactive."
        : "Reactivate this business and its users?",
    });
  };

  const handleConfirm = async () => {
    const { businessId, action } = confirmModal;
    try {
      if (action === "deactivate") {
        await API.delete(`/businesses/${businessId}/`);
        toast.info("Business deactivated");
      } else {
        await API.post(`/businesses/${businessId}/reactivate/`);
        toast.info("Business reactivated");
      }
      fetchBusinesses();
    } catch (err) {
      console.error(err);
      toast.error("Action failed. Please try again.");
    } finally {
      setConfirmModal({ show: false, action: null, businessId: null, message: "" });
    }
  };

  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase()) ||
    b.phone.toLowerCase().includes(query.toLowerCase()) ||
    (b.owner_email?.toLowerCase().includes(query.toLowerCase()) ?? false)
  );

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h3 className="mb-0">
          <i className="fas fa-building me-2 text-primary"></i>
          Businesses (Admin)
        </h3>
        <Button onClick={() => setShowCreate(true)} variant="primary">
          <i className="fas fa-plus me-2"></i> Create Business + Owner
        </Button>
      </div>

      {/* Alerts */}
      {alert.show && (
        <Alert
          variant={alert.variant}
          className="position-fixed top-0 end-0 m-3 shadow"
          style={{ zIndex: 2000, minWidth: "250px" }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Search */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Control
            placeholder="Search businesses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Col>
      </Row>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <div className="table-responsive fade-in">
          <Table hover bordered align="middle">
            <thead className="table-light">
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
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-3">
                    No businesses found
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((b) => (
                  <tr
                    key={b.id}
                    className={!b.is_active ? "table-danger" : ""}
                  >
                    <td>{b.id}</td>
                    <td title={b.name}>
                      {b.name.length > 25 ? b.name.slice(0, 25) + "…" : b.name}
                    </td>
                    <td>{b.phone}</td>
                    <td>{b.timezone}</td>
                    <td>
                      <span
                        className={`badge ${b.is_active ? "bg-success" : "bg-secondary"
                          }`}
                      >
                        {b.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{new Date(b.created_at).toLocaleString()}</td>
                    <td>
                      {b.is_active ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => confirmAction(b.id, "deactivate")}
                        >
                          <i className="fas fa-ban me-1"></i> Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => confirmAction(b.id, "reactivate")}
                        >
                          <i className="fas fa-redo me-1"></i> Reactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Create Modal */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Form onSubmit={handleCreate}>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-plus-circle me-2 text-primary"></i>
              Create Business + Owner
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h6 className="fw-bold mb-2 text-secondary">Business Details</h6>
            <Form.Group className="mb-3">
              <Form.Label>Business Name</Form.Label>
              <Form.Control
                required
                value={createData.name}
                onChange={(e) =>
                  setCreateData({ ...createData, name: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                value={createData.address}
                onChange={(e) =>
                  setCreateData({ ...createData, address: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                value={createData.phone}
                onChange={(e) =>
                  setCreateData({ ...createData, phone: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Timezone</Form.Label>
              <Form.Control
                value={createData.timezone}
                onChange={(e) =>
                  setCreateData({ ...createData, timezone: e.target.value })
                }
              />
            </Form.Group>

            <hr />
            <h6 className="fw-bold mb-2 text-secondary">Owner Account</h6>
            <Form.Group className="mb-3">
              <Form.Label>Owner Email</Form.Label>
              <Form.Control
                required
                type="email"
                value={createData.owner_email}
                onChange={(e) =>
                  setCreateData({ ...createData, owner_email: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Owner Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  required
                  type={showPassword ? "text" : "password"}
                  value={createData.owner_password}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      owner_password: e.target.value,
                    })
                  }
                />
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"
                    } position-absolute end-0 top-50 translate-middle-y me-3 text-muted`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCreate(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i> Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        show={confirmModal.show}
        onHide={() =>
          setConfirmModal({ show: false, action: null, businessId: null })
        }
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
            Confirm Action
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>{confirmModal.message}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() =>
              setConfirmModal({ show: false, action: null, businessId: null })
            }
          >
            Cancel
          </Button>
          <Button
            variant={
              confirmModal.action === "deactivate" ? "danger" : "success"
            }
            onClick={handleConfirm}
          >
            <i
              className={`fas ${confirmModal.action === "deactivate" ? "fa-ban" : "fa-redo"
                } me-2`}
            ></i>
            {confirmModal.action === "deactivate"
              ? "Deactivate"
              : "Reactivate"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
