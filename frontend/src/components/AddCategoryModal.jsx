// src/components/AddCategoryModal.jsx
import { useState } from "react";
import { Modal, Form, Button, Alert, Spinner } from "react-bootstrap";
import API from "../api/api";

export default function AddCategoryModal({ show, onHide, type, onAdded }) {
    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        setError("");
        try {
            const res = await API.post("/finance/categories/", {
                name: name.trim(),
                type,
            });
            onAdded?.(res.data);
            setName("");
            onHide();
        } catch (err) {
            console.error(err);
            const detail = err?.response?.data?.name?.[0] || err?.response?.data?.detail || "Failed to add category.";
            setError(detail);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setError("");
        setName("");
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Add New {type === "income" ? "Income" : "Expense"} Category</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group>
                        <Form.Label>Category Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter category name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            required
                            disabled={submitting}
                        />
                    </Form.Group>

                    <div className="text-end mt-3">
                        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="ms-2"
                            disabled={submitting || !name.trim()}
                        >
                            {submitting ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" /> Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
