// src/components/CashFlowChart.jsx
import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export default function CashFlowChart({ daily = [], monthly = [], useMonthly = false }) {
    const data = useMonthly ? monthly : daily;
    // data items should have {date/month,income,expense}
    return (
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={useMonthly ? "month" : "date"} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="income" name="Income" stroke="#2ca02c" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expense" name="Expense" stroke="#d62728" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
