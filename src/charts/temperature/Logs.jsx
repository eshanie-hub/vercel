import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL from '../../route/api';

const logStyles = `
  .logs-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: 'Poppins', sans-serif;
    min-width: 0;
  }

  .logs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    gap: 10px;
    flex-wrap: wrap;
  }

  .logs-title {
    margin: 0;
    font-weight: 800;
    color: #1e293b;
    font-size: clamp(1rem, 2.5vw, 1.25rem);
    white-space: nowrap;
  }

  .dropdown-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .filter-select {
    background: white;
    border: 1px solid #f1f5f9;
    padding: 8px 32px 8px 14px;
    border-radius: 25px;
    font-size: 0.8rem;
    color: #64748b;
    cursor: pointer;
    outline: none;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    appearance: none;
    min-width: 0;
    max-width: 100%;
    font-family: 'Poppins', sans-serif;
    width: 100%;
  }

  .filter-select-wrap {
    position: relative;
    flex: 1;
    min-width: 130px;
    max-width: 220px;
  }

  .select-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #3b82f6;
    pointer-events: none;
    font-size: 0.65rem;
  }

  .date-btn {
    background: white;
    border: 1px solid #f1f5f9;
    padding: 8px 14px;
    border-radius: 25px;
    font-size: 0.8rem;
    color: #64748b;
    cursor: pointer;
    outline: none;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-family: 'Poppins', sans-serif;
    white-space: nowrap;
    min-width: 110px;
  }

  .calendar-popup {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: white;
    border-radius: 18px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    padding: 14px;
    z-index: 200;
    width: 260px;
  }

  @media (max-width: 400px) {
    .calendar-popup {
      right: auto;
      left: 0;
      width: 240px;
    }
  }

  .cal-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .cal-nav-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #3b82f6;
    font-size: 1.1rem;
    padding: 4px 8px;
    border-radius: 8px;
  }
  .cal-nav-btn:hover { background: #f1f5f9; }

  .cal-month-label {
    font-weight: 700;
    color: #1e293b;
    font-size: 0.88rem;
    font-family: 'Poppins', sans-serif;
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
  }

  .cal-day-name {
    text-align: center;
    font-size: 0.68rem;
    font-weight: 600;
    color: #94a3b8;
    padding: 3px 0;
    font-family: 'Poppins', sans-serif;
  }

  .cal-day {
    text-align: center;
    padding: 5px 0;
    border-radius: 50%;
    font-size: 0.78rem;
    color: #475569;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    border: none;
    background: none;
  }
  .cal-day:hover { background: #eff6ff; color: #3b82f6; }
  .cal-day.selected { background: #3b82f6; color: white; font-weight: 700; }
  .cal-day.today { border: 1.5px solid #3b82f6; color: #3b82f6; font-weight: 600; }
  .cal-day.empty { cursor: default; }
  .cal-day.empty:hover { background: none; }

  .cal-clear {
    margin-top: 8px;
    width: 100%;
    background: #f1f5f9;
    border: none;
    border-radius: 10px;
    padding: 6px;
    font-size: 0.78rem;
    color: #64748b;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
  }
  .cal-clear:hover { background: #e2e8f0; }

  /* ── Table scroll wrapper ── */
  .scroll-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    background: #f8fafc;
    border-radius: 20px;
    padding: 0 12px 12px 12px;
    min-width: 0;
  }

  /* ── Table layout ── */
  .logs-table {
    width: 100%;
    min-width: 480px;
    border-collapse: collapse;
  }

  .logs-table thead tr {
    position: sticky;
    top: 0;
    background: #f8fafc;
    z-index: 10;
  }

  .logs-table th {
    font-weight: 600;
    font-size: 0.82rem;
    color: #334155;
    text-align: center;
    padding: 16px 8px 12px;
    white-space: nowrap;
  }

  .logs-table tbody tr:nth-child(even) {
    background: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.02);
  }

  .logs-table tbody tr:nth-child(odd) {
    background: transparent;
  }

  .logs-table td {
    font-size: 0.8rem;
    color: #64748b;
    text-align: center;
    padding: 11px 8px;
    word-break: break-word;
  }

  .logs-table tbody tr:first-child td:first-child { border-top-left-radius: 10px; }
  .logs-table tbody tr:first-child td:last-child { border-top-right-radius: 10px; }

  /* ── Badge styles ── */
  .status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .status-CRITICAL { background: #fef2f2; color: #dc2626; }
  .status-WARNING  { background: #fff7ed; color: #ea580c; }
  .status-NORMAL   { background: #f0fdf4; color: #16a34a; }
  .status-default  { background: #f1f5f9; color: #475569; }

  .temp-value {
    font-weight: 600;
    color: #1e293b;
    font-size: 0.82rem;
  }

  .empty-state {
    padding: 32px 0;
    text-align: center;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  /* ── Responsive: stack header on small screens ── */
  @media (max-width: 560px) {
    .logs-header {
      flex-direction: column;
      align-items: flex-start;
    }
    .dropdown-group {
      width: 100%;
    }
    .filter-select-wrap {
      max-width: none;
      flex: 1 1 calc(50% - 4px);
      min-width: 120px;
    }
    .date-btn-wrap {
      flex: 1 1 calc(50% - 4px);
      min-width: 110px;
    }
  }

  @media (max-width: 380px) {
    .filter-select-wrap,
    .date-btn-wrap {
      flex: 1 1 100%;
      max-width: none;
    }
    .date-btn {
      width: 100%;
    }
  }
`;

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function CalendarPicker({ value, onChange, onClose }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(value ? new Date(value).getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? new Date(value).getMonth() : today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const selectDay = (day) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
    onClose();
  };

  const isSelected = (day) => {
    if (!value) return false;
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === value;
  };

  const isToday = (day) => day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="calendar-popup">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">{MONTHS[viewMonth]} {viewYear}</span>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
      </div>
      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
        {cells.map((day, i) =>
          day === null ? (
            <div key={`e-${i}`} className="cal-day empty" />
          ) : (
            <button
              key={day}
              className={`cal-day${isSelected(day) ? " selected" : ""}${isToday(day) && !isSelected(day) ? " today" : ""}`}
              onClick={() => selectDay(day)}
            >
              {day}
            </button>
          )
        )}
      </div>
      <button className="cal-clear" onClick={() => { onChange(""); onClose(); }}>Clear</button>
    </div>
  );
}

function formatRouteLabel(route) {
  if (!route) return "";
  const start = route.start_time
    ? new Date(route.start_time).toLocaleString("en-GB", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
        hour12: false, timeZone: "Asia/Colombo",
      })
    : "Unknown";
  return `${route.route_id} (${route.status}) - ${start}`;
}

function getStatusClass(status) {
  if (status === "CRITICAL") return "status-badge status-CRITICAL";
  if (status === "WARNING")  return "status-badge status-WARNING";
  if (status === "NORMAL")   return "status-badge status-NORMAL";
  return "status-badge status-default";
}

const BUCKET_MS = 60 * 1000;

function getBucketStart(ts, anchorTs = 0) {
  return anchorTs + Math.floor((ts - anchorTs) / BUCKET_MS) * BUCKET_MS;
}

export default function TemperatureLogs() {
  const [logs, setLogs] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCal, setShowCal] = useState(false);
  const calRef = useRef(null);

  const selectedRoute = routes.find((r) => r.route_id === selectedRouteId) || null;

const routeAnchorTs = selectedRoute?.start_time
  ? new Date(selectedRoute.start_time).getTime()
  : 0;

function groupLogsByMinute(logs, anchorTs = 0) {
  const minuteMap = new Map();

  logs.forEach((log) => {
    const ts = log.createdAt || log.timestamp;
    if (!ts) return;

    const currentTs = new Date(ts).getTime();
    const minuteKey = getBucketStart(currentTs, anchorTs);

    const existing = minuteMap.get(minuteKey);

    if (!existing) {
      minuteMap.set(minuteKey, {
        ...log,
        bucketStartTime: minuteKey,
      });
    } else {
      const existingTime = new Date(existing.createdAt || existing.timestamp).getTime();

      // keep latest actual record inside that aligned minute bucket
      if (currentTs > existingTime) {
        minuteMap.set(minuteKey, {
          ...log,
          bucketStartTime: minuteKey,
        });
      }
    }
  });

  return Array.from(minuteMap.values()).sort(
    (a, b) => (b.bucketStartTime || 0) - (a.bucketStartTime || 0)
  );
}
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const [routesRes, currentRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/route`),
          axios.get(`${API_BASE_URL}/api/route/current`),
        ]);
        const allRoutes = Array.isArray(routesRes.data) ? routesRes.data : [];
        setRoutes(allRoutes);
        const currentRoute = currentRes.data;
        if (currentRoute?.route_id) {
          setSelectedRouteId(prev => prev || currentRoute.route_id);
        } else if (allRoutes.length > 0) {
          setSelectedRouteId(prev => prev || allRoutes[0].route_id);
        }
      } catch (e) { console.error("Error fetching routes:", e); }
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const url = selectedRouteId
          ? `${API_BASE_URL}/api/temperature?route_id=${encodeURIComponent(selectedRouteId)}`
          : `${API_BASE_URL}/api/temperature`;
        const res = await axios.get(url);
        setLogs(res.data.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)));
      } catch (e) { console.error("Error fetching logs:", e); }
    };
    fetchLogs();
    const iv = setInterval(fetchLogs, 10000);
    return () => clearInterval(iv);
  }, [selectedRouteId]);

  useEffect(() => {
    const handler = (e) => { if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatSLTime = (ts) => {
  if (!ts) return "N/A";
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    
    hour12: true,
    timeZone: "Asia/Colombo",
  }).replace(",", "");
};

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "Date";
    const [y, m, d] = dateStr.split("-");
    return `${parseInt(d)} ${MONTHS[parseInt(m) - 1].slice(0, 3)} ${y}`;
  };
  

const filteredLogs = groupLogsByMinute(
  logs.filter((log) => {
    const ts = log.createdAt || log.timestamp;
    if (!ts) return false;

    const localDate = new Date(ts).toLocaleDateString("en-CA", {
      timeZone: "Asia/Colombo",
    });

    return (filterDate === "" || localDate === filterDate) &&
           (filterStatus === "" || log.temp_status === filterStatus);
  }),
  routeAnchorTs
);

  return (
    <div className="logs-container">
      <style>{logStyles}</style>

      {/* ── Header ── */}
      <div className="logs-header">
        <h2 className="logs-title">Logs</h2>

        <div className="dropdown-group">
          {/* Route select */}
          <div className="filter-select-wrap">
            <select
              className="filter-select"
              value={selectedRouteId}
              onChange={e => setSelectedRouteId(e.target.value)}
            >
              <option value="">All Routes</option>
              {routes.map(route => (
                <option key={route.route_id} value={route.route_id}>
                  {formatRouteLabel(route)}
                </option>
              ))}
            </select>
            <span className="select-arrow">▼</span>
          </div>

          {/* Status select */}
          <div className="filter-select-wrap">
            <select
              className="filter-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="NORMAL">NORMAL</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="T-ERR">T-ERR</option>
            </select>
            <span className="select-arrow">▼</span>
          </div>

          {/* Date picker */}
          <div className="date-btn-wrap" style={{ position: "relative" }} ref={calRef}>
            <button className="date-btn" onClick={() => setShowCal(v => !v)}>
              <span style={{ color: filterDate ? "#1e293b" : "#94a3b8" }}>
                {formatDisplayDate(filterDate)}
              </span>
              <span style={{ color: "#3b82f6", fontSize: "0.65rem" }}>▼</span>
            </button>
            {showCal && (
              <CalendarPicker value={filterDate} onChange={setFilterDate} onClose={() => setShowCal(false)} />
            )}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="scroll-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Route</th>
              <th>Temperature</th>
              <th>Status</th>
              <th>Fan</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">No temperature logs found.</td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log._id}>
                  <td>{formatSLTime(log.bucketStartTime || log.createdAt || log.timestamp)}</td>
                  <td style={{ fontSize: "0.75rem", color: "#64748b" }}>{log.route_id || "No Route"}</td>
                  <td>
                    <span className="temp-value">
                      {log.temp !== null && log.temp !== undefined ? `${log.temp} °C` : "N/A"}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusClass(log.temp_status)}>
                      {log.temp_status || "—"}
                    </span>
                  </td>
                  <td>{log.fan || "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}