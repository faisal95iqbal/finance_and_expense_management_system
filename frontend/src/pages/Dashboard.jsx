import { useEffect, useState } from "react";
import { LineChart, Line, PieChart, Pie } from "recharts";
import useWebSocket from "../hooks/useWebSocket";

function Dashboard() {
    const [data, setData] = useState({});
    const { lastMessage } = useWebSocket("/ws/reports/");

    useEffect(() => {
        if (lastMessage?.type === "UPDATE_REPORTS") {
            setData(lastMessage.data); // recalc backend dataset
        }
    }, [lastMessage]);

    return (
        <LineChart data={data.expensesOverTime} animationDuration={500}>
            <Line type="monotone" dataKey="amount" stroke="#007bff" />
        </LineChart>
    );
}

export default Dashboard;
