// src/hooks/useWebSocket.js
import { useEffect, useRef, useState } from "react";

export default function useWebSocket({ url, token, onOpen, onMessage, onClose, reconnect = true }) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(reconnect);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !url) return;

    const openSocket = () => {
      // ensure ws scheme
      let wsUrl = url;
      if (url.startsWith("/")) {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const host = window.location.hostname + (window.location.port ? `:${window.location.port}` : "");
        wsUrl = `${protocol}://${host}${url}`;
      }
      // append token query param
      const sep = wsUrl.includes("?") ? "&" : "?";
      wsUrl = `${wsUrl}${sep}token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        if (onOpen) onOpen();
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (onMessage) onMessage(data);
        } catch (err) {
          // fallback raw
          if (onMessage) onMessage(e.data);
        }
      };

      ws.onclose = (ev) => {
        setConnected(false);
        if (onClose) onClose(ev);
        // reconnect strategy
        if (reconnectRef.current) {
          setTimeout(() => {
            openSocket();
          }, 2000);
        }
      };

      ws.onerror = () => {
        // connection error — will close and attempt reconnect
      };
    };

    openSocket();

    return () => {
      reconnectRef.current = false;
      if (wsRef.current) try { wsRef.current.close(); } catch (e) {}
    };
  }, [url, token]); // reconnect when token/url changes

  const send = (obj) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(obj));
    } else {
      console.warn("WebSocket not open, cannot send", obj);
    }
  };

  return { send, connected, ws: wsRef.current };
}
