import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const logStyles = `
  .logs-container {
    height: 100%; display: flex; flex-direction: column;
    font-family: 'Poppins', sans-serif;
  }

  /* ── Header ── */
  .logs-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px; gap: 10px; flex-wrap: wrap;
  }
  .logs-header h2 {
    margin: 0; font-weight: 800; color: #1e293b;
    font-size: clamp(1rem, 3vw, 1.3rem);
  }

  /* ── Filter row ── */
  .dropdown-group {
    display: flex; gap: 8px; flex-wrap: wrap;
  }

  .filter-select {
    background: white; border: 1px solid #f1f5f9;
    padding: 8px 14px; border-radius: 25px;
    font-size: clamp(0.72rem, 2vw, 0.9rem);
    color: #64748b; cursor: pointer;
    outline: none; box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    appearance: none;
    min-width: 0; flex: 1 1 120px; max-width: 180px;
  }

  .date-btn {
    background: white; border: 1px solid #f1f5f9;
    padding: 8px 14px; border-radius: 25px;
    font-size: clamp(0.72rem, 2vw, 0.9rem);
    color: #64748b; cursor: pointer;
    outline: none; box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    flex: 1 1 120px; max-width: 180px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 8px;
    white-space: nowrap; min-width: 0;
  }

  /* ── Calendar ── */
  .calendar-popup {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: white; border-radius: 20px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    padding: 16px; z-index: 100; width: 260px;
  }
  .cal-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .cal-nav-btn { background: none; border: none; cursor: pointer; color: #3b82f6; font-size: 1.1rem; padding: 4px 8px; border-radius: 8px; }
  .cal-month-label { font-weight: 700; color: #1e293b; font-size: 0.92rem; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .cal-day-name { text-align: center; font-size: 0.7rem; font-weight: 600; color: #94a3b8; padding: 4px 0; }
  .cal-day { text-align: center; padding: 6px 0; border-radius: 50%; font-size: 0.8rem; color: #475569; cursor: pointer; border: none; background: none; }
  .cal-day:hover { background: #eff6ff; color: #3b82f6; }
  .cal-day.selected { background: #3b82f6; color: white; font-weight: 700; }
  .cal-day.today { border: 1.5px solid #3b82f6; color: #3b82f6; font-weight: 600; }

  /* ── Scroll wrapper ── */
  .scroll-wrapper {
    flex: 1; overflow-y: auto;
    background: #f8fafc; border-radius: 20px;
    padding: 0 12px 12px 12px;
  }

  /* ── Desktop table grid (4 cols) ── */
  .logs-grid-header {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
    padding: 16px 4px 10px;
    position: sticky; top: 0;
    background: #f8fafc; z-index: 10;
  }
  .log-row {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
    padding: 12px 4px; border-radius: 12px; margin-bottom: 5px;
    background: transparent; align-items: center;
  }
  .log-row:nth-child(even) { background-color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }

  .column-label { font-weight: 600; font-size: 0.85rem; color: #334155; text-align: center; }
  .log-entry { font-size: 0.82rem; color: #64748b; text-align: center; }

  /* ── Mobile card layout (≤ 600px) ── */
  @media (max-width: 600px) {
    .logs-grid-header { display: none; }

    .log-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px;
      border-radius: 14px;
      margin-bottom: 8px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .log-row:nth-child(even) { background: white; }

    .log-entry {
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      font-size: 0.8rem;
      width: 100%;
    }
    .log-entry::before {
      content: attr(data-label);
      font-weight: 600;
      color: #94a3b8;
      font-size: 0.72rem;
      flex: 0 0 110px;
    }
  }

  /* ── Status badge ── */
  .status-badge {
    padding: 3px 10px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.73rem;
    display: inline-block;
  }
  .st-stable   { color: #3182ce; }
  .st-moderate { color: #ea580c; }
  .st-high     { color: #dc2626; }
  .st-critical { color: #991b1b; }
`;

const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarPicker({ value, onChange, onClose }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(value ? new Date(value).getFullYear()  : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? new Date(value).getMonth()     : today.getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

  const prevMonth = () => viewMonth === 0  ? (setViewMonth(11), setViewYear(v => v - 1)) : setViewMonth(v => v - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(v => v + 1)) : setViewMonth(v => v + 1);

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
          day === null
            ? <div key={i} className="cal-day empty" />
            : (
              <button
                key={i}
                className={`cal-day ${value === `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` ? 'selected' : ''}`}
                onClick={() => {
                  onChange(`${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
                  onClose();
                }}
              >
                {day}
              </button>
            )
        )}
      </div>
    </div>
  );
}

const getStatusBadge = (status) => {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s.includes('stable'))   return 'status-badge st-stable';
  if (s.includes('moderate')) return 'status-badge st-moderate';
  if (s.includes('high'))     return 'status-badge st-high';
  if (s.includes('critical')) return 'status-badge st-critical';
  return 'status-badge';
};

export default function MotionLogs() {
  const [logs,         setLogs]         = useState([]);
  const [filterDate,   setFilterDate]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCal,      setShowCal]      = useState(false);
  const calRef = useRef(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/motion');
        setLogs(response.data.sort((a, b) => new Date(b.time) - new Date(a.time)));
      } catch (error) {
        console.error('Error fetching motion logs:', error);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ts) =>
    new Date(ts).toLocaleString('en-GB', {
      day: 'numeric', month: 'short',
      hour: 'numeric', minute: '2-digit',
      hour12: true, timeZone: 'Asia/Colombo'
    }).replace(',', '');

  const filteredLogs = logs.filter(log => {
    const logDate     = new Date(log.time).toISOString().split('T')[0];
    const matchesDate   = filterDate   === '' || logDate    === filterDate;
    const matchesStatus = filterStatus === '' || log.status === filterStatus;
    return matchesDate && matchesStatus;
  });

  return (
    <div className="logs-container">
      <style>{logStyles}</style>

      {/* ── Header ── */}
      <div className="logs-header">
        <h2>Logs</h2>
        <div className="dropdown-group">

          <div style={{ position: 'relative' }}>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Intensities</option>
              <option value="Stable">Stable</option>
              <option value="Moderate Vibration">Moderate Vibration</option>
              <option value="High Vibration">High Vibration</option>
              <option value="Critical Shock">Critical Shock</option>
            </select>
          </div>

          <div style={{ position: 'relative' }} ref={calRef}>
            <button className="date-btn" onClick={() => setShowCal(!showCal)}>
              <span>{filterDate || 'Filter Date'}</span>
              <span style={{ color: '#3b82f6' }}>▼</span>
            </button>
            {showCal && (
              <CalendarPicker
                value={filterDate}
                onChange={setFilterDate}
                onClose={() => setShowCal(false)}
              />
            )}
          </div>

          {/* Clear filters button — shown only when a filter is active */}
          {(filterDate || filterStatus) && (
            <button
              onClick={() => { setFilterDate(''); setFilterStatus(''); }}
              style={{
                background: 'none', border: '1px solid #fecaca',
                borderRadius: '25px', padding: '8px 14px',
                fontSize: 'clamp(0.68rem, 2vw, 0.82rem)',
                color: '#dc2626', cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="scroll-wrapper">
        {/* Desktop header */}
        <div className="logs-grid-header">
          <div className="column-label">Recorded Time</div>
          <div className="column-label">Net G-Force</div>
          <div className="column-label">Total G-Force</div>
          <div className="column-label">Vibration Status</div>
        </div>

        <div className="logs-body">
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              No logs found for selected filters.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log._id} className="log-row">
                <div className="log-entry" data-label="Time">
                  {formatTime(log.time)}
                </div>
                <div className="log-entry" data-label="Net G-Force"
                  style={{ fontWeight: 700, color: '#1e293b' }}>
                  {log.net_g.toFixed(3)} g
                </div>
                <div className="log-entry" data-label="Total G-Force">
                  {log.total_g.toFixed(3)} g
                </div>
                <div className="log-entry" data-label="Status">
                  <span className={getStatusBadge(log.status)}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}