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
