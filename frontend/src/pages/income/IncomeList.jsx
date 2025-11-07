{/*
import { useEffect, useState } from "react";
import API from "../../api/api"
import { Table, Button, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function IncomeList() {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await API.get("/finance/incomes/");
            setIncomes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this income?")) return;
        try {
            await API.delete(`/finance/incomes/${id}/`);
            fetch();
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    };

    return (
        <Container className="mt-4">
            <Row className="mb-3">
                <Col><h3>Incomes</h3></Col>
                <Col className="text-end"><Link to="/incomes/new" className="btn btn-primary">Add Income</Link></Col>
            </Row>

            <Row>
                <Col>
                    {loading ? <p>Loading...</p> : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr><th>Date</th><th>Amount</th><th>Source</th><th>Description</th><th>Receipt</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {incomes.length === 0 && <tr><td colSpan="6">No incomes</td></tr>}
                                {incomes.map(i => (
                                    <tr key={i.id}>
                                        <td>{i.date}</td>
                                        <td>{i.amount}</td>
                                        <td>{i.source || "-"}</td>
                                        <td>{i.description}</td>
                                        <td>{i.receipt ? <a href={`http://localhost:8000${i.receipt}`} target="_blank" rel="noreferrer">View</a> : "-"}</td>
                                        <td><Button size="sm" variant="outline-danger" onClick={() => handleDelete(i.id)}>Delete</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Col>
            </Row>
        </Container>
    );
}


*/}

// src/pages/finance/IncomeList.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";
import {
    Table,
    Button,
    Container,
    Row,
    Col,
    Form,
    Spinner,
    Badge,
    Card,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import {toast} from "react-toastify";

export default function IncomeList() {
    const [incomes, setIncomes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        category: "",
        start_date: "",
        end_date: "",
        search: "",
    });
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await API.get("/finance/incomes/", { params: filters });
            setIncomes(res.data);
        } catch (err) {
            toast.error("Failed to fetch incomes list.");
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await API.get("/finance/categories/", { params: { type: "income" } });
            setCategories(res.data);
        } catch (err) {
            
        }
    };

    useEffect(() => {
        loadCategories();
        fetch();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this income?")) return;
        try {
            await API.delete(`/finance/incomes/${id}/`);
            toast.success("Income deleted successfully.");
            fetch();
        } catch (err) {
            toast.error("Delete failed.try again.");
        }
    };

    const total = incomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

    return (
        <Container className="mt-4">
            <Row className="mb-3 align-items-center">
                <Col>
                    <h3 className="fw-semibold">💵 Incomes</h3>
                    <div className="text-muted">
                        Total: <strong>PKR {total.toLocaleString()}</strong>
                    </div>
                </Col>
                <Col className="text-end">
                    <Link to="/incomes/new" className="btn btn-primary">
                        + Add Income
                    </Link>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="mb-3 shadow-sm border-0">
                <Card.Body>
                    <Row className="align-items-end g-3">
                        <Col md={3}>
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            >
                                <option value="">All</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label>From</Form.Label>
                            <Form.Control
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label>To</Form.Label>
                            <Form.Control
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Label>Search</Form.Label>
                            <Form.Control
                                placeholder="Source or Description"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </Col>
                        <Col md="auto">
                            <Button variant="primary" onClick={fetch}>
                                Apply
                            </Button>
                            <Button
                                variant="outline-secondary"
                                className="ms-2"
                                onClick={() => {
                                    setFilters({ category: "", start_date: "", end_date: "", search: "" });
                                    fetch();
                                }}
                            >
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Table */}
            <Card className="shadow-sm border-0">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : incomes.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <p className="mb-1">No incomes found</p>
                            <small>Try adjusting your filters or add a new record.</small>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount (PKR)</th>
                                        <th>Category</th>
                                        <th>Source</th>
                                        <th>Description</th>
                                        <th>Receipt</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incomes.map((i) => (
                                        <tr key={i.id}>
                                            <td>{i.date}</td>
                                            <td className="fw-semibold">{Number(i.amount).toLocaleString()}</td>
                                            <td>
                                                {categories.find(c => c.id === i.category)?.name || "-"}
                                            </td>
                                            <td>{i.source || "-"}</td>
                                            <td style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {i.description || "-"}
                                            </td>
                                            <td>
                                                {i.receipt ? (
                                                    <a
                                                        href={`http://localhost:8000${i.receipt}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        View
                                                    </a>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="text-end">
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleDelete(i.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}
