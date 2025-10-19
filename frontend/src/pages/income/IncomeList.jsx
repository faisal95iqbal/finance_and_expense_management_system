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
