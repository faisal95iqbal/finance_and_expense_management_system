// src/hooks/useFinanceDashboard.js
import { useEffect, useState, useRef, useContext, useCallback } from "react";
import API from "../api/api";
import useWebSocket from "./useWebSocket";
import { AuthContext } from "../contexts/AuthContext";

const DEFAULT_CACHE_TTL = 60 * 1000; // 60s

function makeCacheKey(businessId, startDate, endDate, period) {
    return `finance_dashboard_${businessId}_${startDate || "auto"}_${endDate || "auto"}_${period || "auto"}`;
}

export default function useFinanceDashboard({ startDate = null, endDate = null, period = "auto", refreshOnConnect = true } = {}) {
    const { user } = useContext(AuthContext);
    const businessId = user?.business_id;
    const token = user?.token;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const cacheKey = makeCacheKey(businessId, startDate, endDate, period);

    const fetchData = useCallback(async (opts = { force: false }) => {
        if (!businessId) return;
        // localStorage caching
        try {
            const cachedRaw = localStorage.getItem(cacheKey);
            if (!opts.force && cachedRaw) {
                const cached = JSON.parse(cachedRaw);
                if (Date.now() - cached.ts < DEFAULT_CACHE_TTL) {
                    setData(cached.payload);
                    return cached.payload;
                }
            }
        } catch (e) {
            // ignore
        }

        setLoading(true);
        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (period) params.period = period;
            const res = await API.get("/finance/dashboard/", { params });
            const payload = res.data;
            setData(payload);
            try {
                localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }));
            } catch (e) { }
            setLoading(false);
            return payload;
        } catch (err) {
            setLoading(false);
            console.error("dashboard fetch failed", err);
            throw err;
        }
    }, [businessId, startDate, endDate, period, cacheKey]);

    // websocket: listen for dashboard_update via /ws/notifications/
    const onMessage = (msg) => {
        if (!msg || !msg.type) return;
        if (msg.type === "dashboard_update") {
            // invalidate local cache + refetch
            try {
                localStorage.removeItem(cacheKey);
            } catch (e) { }
            // small debounce to avoid many refetches
            setTimeout(() => fetchData({ force: true }), 200);
        }
    };

    useWebSocket({
        url: "/ws/notifications/",
        token,
        onMessage,
        reconnect: true,
    });

    // initial load
    useEffect(() => {
        if (!businessId) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessId, startDate, endDate, period]);

    return { data, loading, refresh: () => fetchData({ force: true }) };
}
