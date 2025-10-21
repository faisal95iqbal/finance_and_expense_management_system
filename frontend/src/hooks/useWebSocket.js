// src/hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Robust WebSocket hook.
 * - url: absolute or relative (if starts with "/")
 * - token: JWT access token (appended as query param `token=...`)
 * - onOpen/onMessage/onClose: callbacks
 * - reconnect: true/false
 *
 * Returns: { send(obj), connected, close() }
 */
export default function useWebSocket({
  url,
  token,
  onOpen,
  onMessage,
  onClose,
  reconnect = true,
  maxBackoffMs = 30000,
}) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(reconnect);
  const backoffRef = useRef(1000); // start 1s
  const [connected, setConnected] = useState(false);
  const sendQueueRef = useRef([]);

  const buildWsUrl = useCallback(() => {
    if (!url) return null;
    // if relative path, build absolute
    let wsUrl = url;
    if (wsUrl.startsWith("/")) {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const host = "127.0.0.1:8000";
      wsUrl = `${protocol}://${host}${wsUrl}`;
    }
    // append token param if present
    if (token) {
      const sep = wsUrl.includes("?") ? "&" : "?";
      wsUrl = `${wsUrl}${sep}token=${encodeURIComponent(token)}`;
    }
    return wsUrl;
  }, [url, token]);

  useEffect(() => {
    if (!url || !token) return;

    reconnectRef.current = reconnect;

    let closedByHook = false;

    const connect = () => {
      const wsUrl = buildWsUrl();
      if (!wsUrl) return;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = (ev) => {
          backoffRef.current = 1000; // reset backoff
          setConnected(true);
          // flush queue
          while (sendQueueRef.current.length) {
            const msg = sendQueueRef.current.shift();
            try { ws.send(JSON.stringify(msg)); } catch (e) { console.warn("WS send failed", e); }
          }
          if (onOpen) onOpen(ev);
        };

        ws.onmessage = (ev) => {
          if (!ev.data) return;
          let parsed;
          try {
            parsed = JSON.parse(ev.data);
          } catch (err) {
            parsed = ev.data;
          }
          if (onMessage) onMessage(parsed);
        };

        ws.onclose = (ev) => {
          setConnected(false);
          if (onClose) onClose(ev);
          wsRef.current = null;
          if (!closedByHook && reconnectRef.current) {
            const backoff = Math.min(backoffRef.current, maxBackoffMs);
            setTimeout(() => {
              // exponential backoff
              backoffRef.current = Math.min(backoffRef.current * 2, maxBackoffMs);
              connect();
            }, backoff);
          }
        };

        ws.onerror = (err) => {
          // let onclose handle reconnection
          console.warn("WebSocket error", err);
        };
      } catch (err) {
        console.error("Failed to open WebSocket", err);
      }
    };

    connect();

    return () => {
      // tell reconnect logic not to reconnect
      reconnectRef.current = false;
      closedByHook = true;
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) { }
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildWsUrl, token, url]); // reconnect when token/url changes

  const send = (obj) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(obj));
      } else {
        // queue if not ready
        sendQueueRef.current.push(obj);
      }
    } catch (err) {
      console.warn("WebSocket send failed", err);
    }
  };

  const close = () => {
    reconnectRef.current = false;
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) { }
      wsRef.current = null;
    }
    setConnected(false);
  };

  return { send, connected, close };
}
