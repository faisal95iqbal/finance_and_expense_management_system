// src/components/KPICards.jsx
import { Row, Col, Card } from "react-bootstrap";

export default function KPICards({ summary = {}, loading }) {
    const income = summary?.total_income ?? 0;
    const expense = summary?.total_expense ?? 0;
    const net = summary?.net ?? 0;
    const margin = summary?.profit_margin_percent;

    function marginColor(m) {
        if (m === null || m === undefined) return "secondary";
        if (m >= 25) return "success";
        if (m >= 10) return "warning";
        return "danger";
    }

    return (
        <Row className="g-2">
            <Col sm={6} md={3}>
                <Card>
                    <Card.Body>
                        <div className="text-muted small">Total Income</div>
                        <div className="h5">{loading ? "..." : `$${income.toLocaleString()}`}</div>
                    </Card.Body>
                </Card>
            </Col>
            <Col sm={6} md={3}>
                <Card>
                    <Card.Body>
                        <div className="text-muted small">Total Expense</div>
                        <div className="h5">{loading ? "..." : `$${expense.toLocaleString()}`}</div>
                    </Card.Body>
                </Card>
            </Col>
            <Col sm={6} md={3}>
                <Card>
                    <Card.Body>
                        <div className="text-muted small">Net</div>
                        <div className="h5">{loading ? "..." : `$${net.toLocaleString()}`}</div>
                    </Card.Body>
                </Card>
            </Col>
            <Col sm={6} md={3}>
                <Card>
                    <Card.Body>
                        <div className="text-muted small">Profit Margin</div>
                        <div className={`h5 text-${marginColor(margin)}`}>{loading ? "..." : (margin === null ? "N/A" : `${margin.toFixed(1)}%`)}</div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}
