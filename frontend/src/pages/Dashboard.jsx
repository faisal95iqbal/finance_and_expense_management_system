// src/pages/Dashboard.jsx
import React, { useContext, useRef } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import useFinanceDashboard from "../hooks/useFinanceDashboard";
import { AuthContext } from "../contexts/AuthContext";
import KPICards from "../components/KPICards";
import CashFlowChart from "../components/CashFlowChart";
import TopCategories from "../components/TopCategories";
import RecentTransactions from "../components/RecentTransactions";
import ExportButtons from "../components/ExportButtons";


export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const { data, loading, refresh } = useFinanceDashboard({});

    // Refs for charts (used in ExportButtons)
    const cashFlowRef = useRef(null);
    const topExpensesRef = useRef(null);
    const topIncomeRef = useRef(null);

    if (!user) return <div>Please login</div>;

    return (
        <>
            {data && (
                <Container fluid>
                    <Row className="my-3 align-items-center justify-content-between">
                        <Col>
                            <h2>Business Dashboard</h2>
                        </Col>
                        <Col>
                            <ExportButtons
                                chartRefs={{ cashFlowRef, topExpensesRef, topIncomeRef }}
                                // optional date filters; adjust as per your hook state
                                date_from={data?.filters?.date_from || null}
                                date_to={data?.filters?.date_to || null}
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col xs={12} lg={8}>
                            <KPICards summary={data?.summary} loading={loading} />
                            <Card className="my-3" ref={cashFlowRef}>
                                <Card.Body>
                                    <h5>Cash Flow</h5>
                                    <CashFlowChart daily={data?.cash_flow?.daily || []} monthly={data?.cash_flow?.monthly || []} />
                                </Card.Body>
                            </Card>

                            <Card className="my-3">
                                <Card.Body>
                                    <h5>Month-over-month Growth</h5>
                                    <div>{data?.month_over_month_growth_percent ? `${data.month_over_month_growth_percent.toFixed(1)}%` : "N/A"}</div>
                                </Card.Body>
                            </Card>

                            <Card className="my-3">
                                <Card.Body>
                                    <h5>Recent Transactions</h5>
                                    <RecentTransactions items={data?.recent_transactions || []} />
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xs={12} lg={4}>
                            
                            <Card className="my-3" ref={topExpensesRef}>
                                <Card.Body>
                                    <h5>Top Expense Categories</h5>
                                    <TopCategories items={data?.top_categories || []} />
                                </Card.Body>
                            </Card>
                            <Card className="my-3" ref={topIncomeRef}>
                                <Card.Body>
                                    <h5>Top Income Categories</h5>
                                    <TopCategories items={data?.top_income_categories || []} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            )}
        </>
    );
}
