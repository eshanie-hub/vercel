import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL from '../../route/api';

const logStyles = `
  /* EXACT SAME AS TEMPERATURE STYLES */
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
  }

  .scroll-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    background: #f8fafc;
    border-radius: 20px;
    padding: 0 12px 12px 12px;
  }

  .logs-table {
    width: 100%;
    min-width: 480px;
    border-collapse: collapse;
  }

  .logs-table th {
    font-weight: 600;
    font-size: 0.82rem;
    color: #334155;
    text-align: center;
    padding: 16px 8px 12px;
  }

  .logs-table td {
    font-size: 0.8rem;
    color: #64748b;
    text-align: center;
    padding: 11px 8px;
  }

  .logs-table tbody tr:nth-child(even) {
    background: white;
  }

  .status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .status-CRITICAL { background: #fef2f2; color: #dc2626; }
  .status-WARNING  { background: #fff7ed; color: #ea580c; }
  .status-NORMAL   { background: #f0fdf4; color: #3182ce; }
  .status-default  { background: #f1f5f9; color: #16a34a; }

  .empty-state {
    padding: 32px 0;
    text-align: center;
    color: #94a3b8;
  }
`;

function getStatusClass(status) {
  if (status === "CRITICAL") return "status-badge status-CRITICAL";
  if (status === "WARNING") return "status-badge status-WARNING";
  if (status === "NORMAL") return "status-badge status-NORMAL";
  return "status-badge status-default";
}

export default function HumidityLogs() {
  const [logs, setLogs] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCal, setShowCal] = useState(false);
  const calRef = useRef(null);

  /* ==== SAME LOGIC (UNCHANGED) ==== */
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
      } catch (error) {
        console.error(error);
      }
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const url = selectedRouteId
          ? `${API_BASE_URL}/api/humidity?route_id=${encodeURIComponent(selectedRouteId)}`
          : `${API_BASE_URL}/api/humidity`;

        const res = await axios.get(url);
        setLogs(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [selectedRouteId]);

  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp || log.createdAt).toISOString().split("T")[0];
    return (filterDate === "" || logDate === filterDate) &&
      (filterStatus === "" || log.hum_status === filterStatus);
  });

  return (
    <div className="logs-container">
      <style>{logStyles}</style>

      <div className="logs-header">
        <h2 className="logs-title">Logs</h2>

        <div className="dropdown-group">
          {/* Route Filter */}
          <div className="filter-select-wrap">
            <select
              className="filter-select"
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
            >
              <option value="">All Routes</option>
              {routes.map(route => (
                <option key={route.route_id} value={route.route_id}>
                  {route.route_id}
                </option>
              ))}
            </select>
            <span className="select-arrow">▼</span>
          </div>

          {/* Status Filter */}
          <div className="filter-select-wrap">
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="NORMAL">NORMAL</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="H-ERR">H-ERR</option>
            </select>
            <span className="select-arrow">▼</span>
          </div>

          {/* Date Filter */}
          <div className="filter-select-wrap">
            <input
              type="date"
              className="filter-select"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="scroll-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Route</th>
              <th>Humidity</th>
              <th>Status</th>
              <th>Fan</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No humidity logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.timestamp || log.createdAt).toLocaleString()}</td>
                  <td>{log.route_id || "No Route"}</td>
                  <td>{log.hum !== undefined ? `${log.hum} %` : "N/A"}</td>
                  <td>
                    <span className={getStatusClass(log.hum_status)}>
                      {log.hum_status || "—"}
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