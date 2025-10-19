import { useEffect, useState } from "react";
import API from "../../api/api"
import { Table, Button, Container, Row, Col, Form } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function ExpenseList() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ q: "", category: "", date_from: "", date_to: "" });
    const [categories, setCategories] = useState([]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.q) params.search = filters.q;
            if (filters.category) params.category = filters.category;
            if (filters.date_from) params.date__gte = filters.date_from;
            if (filters.date_to) params.date__lte = filters.date_to;
            const res = await API.get("/finance/expenses/", { params });
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await API.get("/finance/categories/", { params: { type: "expense" } });
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchExpenses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const applyFilters = () => fetchExpenses();

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this expense?")) return;
        try {
            await API.delete(`/finance/expenses/${id}/`);
            fetchExpenses();
        } catch (err) {
            console.error(err);
            alert("Failed to delete");
        }
    };

    return (
        <Container className="mt-4">
            <Row className="mb-3 align-items-center">
                <Col>
                    <h3>Expenses</h3>
                </Col>
                <Col className="text-end">
                    <Link to="/expenses/new" className="btn btn-primary">Add Expense</Link>
                </Col>
            </Row>

            <Row className="mb-3">
                <Col md={3}>
                    <Form.Control name="q" placeholder="Search" value={filters.q} onChange={handleFilterChange} />
                </Col>
                <Col md={3}>
                    <Form.Select name="category" value={filters.category} onChange={handleFilterChange}>
                        <option value="">All categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                </Col>
                <Col md={2}>
                    <Form.Control type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
                </Col>
                <Col md={2}>
                    <Form.Control type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
                </Col>
                <Col md={2}>
                    <Button variant="secondary" onClick={applyFilters}>Filter</Button>
                </Col>
            </Row>

            <Row>
                <Col>
                    {loading ? <p>Loading...</p> : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Receipt</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.length === 0 && <tr><td colSpan="6">No expenses</td></tr>}
                                {expenses.map(e => (
                                    <tr key={e.id}>
                                        <td>{e.date}</td>
                                        <td>{e.amount}</td>
                                        <td>{e.category ? e.category : "-"}</td>
                                        <td>{e.description}</td>
                                        <td>{e.receipt ? <a href={`http://localhost:8000${e.receipt}`} target="_blank" rel="noreferrer">View</a> : "-"}</td>
                                        <td>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(e.id)}>Delete</Button>
                                        </td>
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
