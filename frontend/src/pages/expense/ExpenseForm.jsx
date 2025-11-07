{/*

import { useEffect, useState } from "react";
import API from "../../api/api"
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function ExpenseForm() {
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [receipt, setReceipt] = useState(null);
    const [categories, setCategories] = useState([]);
    const nav = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await API.get("/finance/categories/", { params: { type: "expense" } });
                setCategories(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("amount", amount);
        if (category) formData.append("category", category);
        if (date) formData.append("date", date);
        if (description) formData.append("description", description);
        if (receipt) formData.append("receipt", receipt);

        try {
            await API.post("/finance/expenses/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            nav("/expenses");
        } catch (err) {
            console.error(err);
            alert("Failed to create expense");
        }
    };

    return (
        <Container className="mt-4">
            <Row>
                <Col md={{ span: 8, offset: 2 }}>
                    <h4>Add Expense</h4>
                    <Form onSubmit={submit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Amount</Form.Label>
                            <Form.Control type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select value={category} onChange={(e) => setCategory(e.target.value)} >
                                <option value="">Select</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Date</Form.Label>
                            <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Receipt (optional)</Form.Label>
                            <Form.Control type="file" onChange={(e) => setReceipt(e.target.files[0])} />
                        </Form.Group>

                        <Button type="submit">Save</Button>
                        <Button variant="secondary" className="ms-2" onClick={() => nav("/expenses")}>Cancel</Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

*/}

// src/pages/expenses/ExpenseForm.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";
import { Container, Row, Col, Form, Button, Card, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AddCategoryModal from "../../components/AddCategoryModal";
import {toast} from "react-toastify";

export default function ExpenseForm() {
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [description, setDescription] = useState("");
    const [receipt, setReceipt] = useState(null);
    const [categories, setCategories] = useState([]);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showAddCat, setShowAddCat] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await API.get("/finance/categories/", {
                    params: { type: "expense" },
                });
                setCategories(res.data);
            } catch (err) {

            }
        };
        load();
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        const formData = new FormData();
        formData.append("amount", amount);
        if (category) formData.append("category", category);
        if (date) formData.append("date", date);
        if (description) formData.append("description", description);
        if (receipt) formData.append("receipt", receipt);

        try {
            await API.post("/finance/expenses/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setSuccess(true);
            setTimeout(() => nav("/expenses"), 800);
            toast.success("Expense created successfully!");
        } catch (err) {
            toast.error("Failed to create expense.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">Add Expense</h5>
                        </Card.Header>
                        <Card.Body>
                            {success && (
                                <Alert variant="success">Expense saved successfully!</Alert>
                            )}

                            <Form onSubmit={submit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Amount</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        placeholder="Enter amount"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select
                                        value={category}
                                        onChange={(e) => {
                                            if (e.target.value === "__add_new__") {
                                                setShowAddCat(true);
                                                return;
                                            }
                                            setCategory(e.target.value);
                                        }}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                        <option value="__add_new__">➕ Add New Category...</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add details..."
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Receipt (optional)</Form.Label>
                                    <Form.Control
                                        type="file"
                                        onChange={(e) => setReceipt(e.target.files[0])}
                                    />
                                </Form.Group>

                                <div className="d-flex justify-content-end">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="me-2 px-4"
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => nav("/expenses")}
                                        className="px-4"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <AddCategoryModal
                show={showAddCat}
                onHide={() => setShowAddCat(false)}
                type="expense"
                onAdded={(newCat) => {
                    setCategories((prev) => [...prev, newCat]);
                    setCategory(newCat.id);
                }}
            />
        </Container>
    );
}
