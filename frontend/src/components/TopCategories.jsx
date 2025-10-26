// src/components/TopCategories.jsx

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#2ca02c", "#d62728", "#ff7f0e", "#1f77b4", "#9467bd"];

export default function TopCategories({ items = [] }) {
    if (!items.length) return <div>No categories</div>;
    const data = items.map((it) => ({ name: it.name, value: it.total }));
    return (
        <div style={{ height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie dataKey="value" isAnimationActive outerRadius={90} data={data} label>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
