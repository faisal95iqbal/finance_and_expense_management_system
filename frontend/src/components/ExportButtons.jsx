// src/components/ExportButtons.jsx
import React from "react";
import API from "../api/api";

function svgToPngDataUrl(svgNode, width = 800, height = 400) {
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgNode);

    // Fix for xmlns
    if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    // create image
    return new Promise((resolve, reject) => {
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            const png = canvas.toDataURL("image/png");
            resolve(png);
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
        };
        img.src = url;
    });
}

export default function ExportButtons({ chartRefs, date_from, date_to }) {
    // chartRefs: { cashFlowRef, topExpensesRef, topIncomeRef } HTML elements that contain the SVG
    const exportCSV = async () => {
        const res = await API.post("/finance/analytics/export/csv/", { date_from, date_to }, { responseType: "blob" });
        const blob = new Blob([res.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const exportPDF = async () => {
        // Convert visible chart SVGs to PNG base64
        const charts = {};
        try {
            if (chartRefs.cashFlowRef && chartRefs.cashFlowRef.current) {
                const svg = chartRefs.cashFlowRef.current.querySelector("svg");
                if (svg) charts.cashFlow = await svgToPngDataUrl(svg, 1200, 400);
            }
            if (chartRefs.topExpensesRef && chartRefs.topExpensesRef.current) {
                const svg = chartRefs.topExpensesRef.current.querySelector("svg");
                if (svg) charts.topExpenses = await svgToPngDataUrl(svg, 800, 400);
            }
            if (chartRefs.topIncomeRef && chartRefs.topIncomeRef.current) {
                const svg = chartRefs.topIncomeRef.current.querySelector("svg");
                if (svg) charts.topIncomes = await svgToPngDataUrl(svg, 800, 400);
            }
        } catch (err) {
            console.error("Chart export failed", err);
        }

        // send to backend
        const resp = await API.post("/finance/analytics/export/pdf/", { charts, date_from, date_to }, { responseType: "blob" });
        const url = window.URL.createObjectURL(resp.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics_${Date.now()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="mb-3">
            <button className="btn btn-outline-primary me-2" onClick={exportCSV}>Export CSV</button>
            <button className="btn btn-outline-secondary" onClick={exportPDF}>Export PDF</button>
        </div>
    );
}
