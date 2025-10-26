{/*
import { useState, useEffect } from "react";
import API from "../../api/api"
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function IncomeForm() {
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [source, setSource] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [receipt, setReceipt] = useState(null);
    const [categories, setCategories] = useState([]);
    const nav = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await API.get("/finance/categories/", { params: { type: "income" } });
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
        if (source) formData.append("source", source);
        if (date) formData.append("date", date);
        if (description) formData.append("description", description);
        if (receipt) formData.append("receipt", receipt);

        try {
            await API.post("/finance/incomes/", formData, { headers: { "Content-Type": "multipart/form-data" } });
            nav("/incomes");
        } catch (err) {
            console.error(err);
            alert("Failed to create income");
        }
    };

    return (
        <Container className="mt-4">
            <Row>
                <Col md={{ span: 8, offset: 2 }}>
                    <h4>Add Income</h4>
                    <Form onSubmit={submit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Amount</Form.Label>
                            <Form.Control type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option value="">Select</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Source</Form.Label>
                            <Form.Control value={source} onChange={(e) => setSource(e.target.value)} />
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
                        <Button variant="secondary" className="ms-2" onClick={() => nav("/incomes")}>Cancel</Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}
*/}

// src/pages/finance/IncomeForm.jsx
import { useState, useEffect } from "react";
import API from "../../api/api";
import { Container, Row, Col, Form, Button, Card, Spinner, Image } from "react-bootstrap";
import AddCategoryModal from "../../components/AddCategoryModal";
import { useNavigate } from "react-router-dom";

export default function IncomeForm() {
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [source, setSource] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [receipt, setReceipt] = useState(null);
    const [categories, setCategories] = useState([]);
    const [preview, setPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showAddCat, setShowAddCat] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await API.get("/finance/categories/", { params: { type: "income" } });
                setCategories(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, []);

    const handleReceipt = (e) => {
        const file = e.target.files[0];
        setReceipt(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const resetForm = () => {
        setAmount("");
        setCategory("");
        setSource("");
        setDate("");
        setDescription("");
        setReceipt(null);
        setPreview(null);
    };

    const submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData();
        formData.append("amount", amount);
        if (category) formData.append("category", category);
        if (source) formData.append("source", source);
        if (date) formData.append("date", date);
        if (description) formData.append("description", description);
        if (receipt) formData.append("receipt", receipt);

        try {
            await API.post("/finance/incomes/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            nav("/incomes");
        } catch (err) {
            console.error(err);
            alert("Failed to create income");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <Card.Title className="mb-4">💰 Add New Income</Card.Title>
                            <Form onSubmit={submit}>
                                <h6 className="text-muted mb-3">Basic Info</h6>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Amount (PKR)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                placeholder="Enter amount"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
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
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Source</Form.Label>
                                            <Form.Control
                                                placeholder="e.g. Client, Product Sale"
                                                value={source}
                                                onChange={(e) => setSource(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Optional details..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </Form.Group>

                                <h6 className="text-muted mb-3 mt-4">Attachments</h6>
                                <Form.Group className="mb-3">
                                    <Form.Label>Receipt (optional)</Form.Label>
                                    <Form.Control type="file" onChange={handleReceipt} />
                                    {preview && (
                                        <div className="mt-2">
                                            <Image
                                                src={preview}
                                                alt="Receipt preview"
                                                thumbnail
                                                style={{ maxHeight: 150 }}
                                            />
                                        </div>
                                    )}
                                </Form.Group>

                                <div className="d-flex justify-content-end">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={submitting}
                                    >
                                        {submitting ? <Spinner size="sm" animation="border" /> : "Save Income"}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="ms-2"
                                        onClick={() => nav("/incomes")}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        className="ms-2"
                                        onClick={resetForm}
                                    >
                                        Clear
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
                type="income"
                onAdded={(newCat) => {
                    setCategories((prev) => [...prev, newCat]);
                    setCategory(newCat.id);
                }}
            />
        </Container>
    );
}
