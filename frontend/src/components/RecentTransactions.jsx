// src/components/RecentTransactions.jsx
import React from "react";
import { Table } from "react-bootstrap";

export default function RecentTransactions({ items = [] }) {
    return (
        <Table responsive size="sm">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {items.map((t) => (
                    <tr key={`${t.type}_${t.id}`}>
                        <td>{t.type}</td>
                        <td>{new Date(t.date).toLocaleDateString()}</td>
                        <td>{t.amount.toLocaleString ? `$${t.amount.toLocaleString()}` : `$${t.amount}`}</td>
                        <td>{t.category || "—"}</td>
                        <td>{t.description?.slice(0, 80) || "—"}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}
