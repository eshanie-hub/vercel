import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import { Droplets, Fan } from "lucide-react";

const socket = io("http://localhost:5000");

export default function LastAlert() {
  const [status, setStatus] = useState("Loading...");
  const [hum, setHum] = useState(null);
  const [fan, setFan] = useState("N/A");
  const [lastTimeDisplay, setLastTimeDisplay] = useState("");
  const location = useLocation();

  const showFanStatus = location.pathname === "/driver";

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    const eventDate = new Date(ts);
    const now = new Date();
    const diffInMs = now - eventDate;
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

    if (diffInMs > twentyFourHoursInMs) {
      return eventDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } else {
      return eventDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/humidity/latest")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setStatus(data.hum_status || "Unknown");
          setHum(data.hum);
          setFan(data.fan || "N/A");
          setLastTimeDisplay(formatTimestamp(data.timestamp || data.createdAt));
        }
      })
      .catch((err) => console.error("Fetch error:", err));

    socket.on("humidityUpdate", (data) => {
      setStatus(data.hum_status || "Unknown");
      setHum(data.hum);
      setFan(data.fan || "N/A");
      setLastTimeDisplay(formatTimestamp(new Date()));
    });

    return () => socket.off("humidityUpdate");
  }, []);

  const isCritical = status === "CRITICAL";
  const isWarning = status === "WARNING";
  const isNormal = status === "NORMAL";
  const isFanOn = fan === "ON";

  const statusColor = isCritical
    ? "#dc2626"
    : isWarning
      ? "#ea580c"
      : isNormal
        ? "#3182ce"
        : "#16a34a";

  return (
    <div style={styles.card}>
      <div>
        <p style={styles.title}>Humidity</p>
        <h1 style={{ ...styles.status, color: statusColor }}>{status}</h1>

        <p style={styles.value}>
          {hum !== null && hum !== undefined ? `${hum} %` : "N/A"}
        </p>

        {showFanStatus && (
          <p style={styles.fanText}>
            <span style={styles.fanInline}>
              <Fan
                size={16}
                color={isFanOn ? "#2563eb" : "#94a3b8"}
                strokeWidth={2.2}
                style={{
                  marginRight: 6,
                  animation: isFanOn ? "spin 1.5s linear infinite" : "none",
                }}
              />
              Fan:
            </span>
            <span
              style={{
                color: isFanOn ? "#2563eb" : "#64748b",
                fontWeight: 700,
                marginLeft: 4,
              }}
            >
              {fan}
            </span>
          </p>
        )}

        <p style={styles.time}>Updated: {lastTimeDisplay}</p>
      </div>

      <div style={styles.iconBox}>
        <Droplets size={24} color="#0ea5e9" strokeWidth={2.2} />
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "'Poppins', sans-serif",
    minHeight: "unset",
  },
  title: {
    margin: "0 0 2px 0",
    color: "#64748b",
    fontSize: "0.85rem",
    fontWeight: "500",
    lineHeight: 1.2,
  },
  status: {
    fontSize: "1.15rem",
    fontWeight: "700",
    margin: "0 0 2px 0",
    lineHeight: 1.2,
  },
  value: {
    margin: "0 0 2px 0",
    color: "#334155",
    fontSize: "0.88rem",
    fontWeight: "600",
    lineHeight: 1.2,
  },
  fanText: {
    margin: "0 0 2px 0",
    color: "#334155",
    fontSize: "0.82rem",
    lineHeight: 1.2,
    display: "flex",
    alignItems: "center",
  },
  fanInline: {
    display: "inline-flex",
    alignItems: "center",
  },
  time: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.75rem",
    lineHeight: 1.2,
  },
  iconBox: {
    padding: "8px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};