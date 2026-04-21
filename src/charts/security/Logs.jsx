import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../route/api';

const logStyles = `
  .logs-container {
    height: 100%; display: flex; flex-direction: column;
    font-family: 'Poppins', sans-serif;
  }
  .logs-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px;
  }
  .dropdown-group { display: flex; gap: 12px; }
  
  .filter-select {
    background: white; 
    border: 1px solid #f1f5f9;
    padding: 10px 20px; 
    border-radius: 25px;
    font-size: 0.9rem; 
    color: #64748b; 
    cursor: pointer;
    outline: none;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    appearance: none;
    min-width: 140px;
  }

  .date-btn {
    background: white;
    border: 1px solid #f1f5f9;
    padding: 10px 20px;
    border-radius: 25px;
    font-size: 0.9rem;
    color: #64748b;
    cursor: pointer;
    outline: none;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    min-width: 140px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-family: 'Poppins', sans-serif;
  }

  .calendar-popup {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: white;
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    padding: 16px;
    z-index: 100;
    width: 280px;
  }

  .cal-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
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
    font-size: 0.95rem;
    font-family: 'Poppins', sans-serif;
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .cal-day-name {
    text-align: center;
    font-size: 0.72rem;
    font-weight: 600;
    color: #94a3b8;
    padding: 4px 0;
    font-family: 'Poppins', sans-serif;
  }

  .cal-day {
    text-align: center;
    padding: 6px 0;
    border-radius: 50%;
    font-size: 0.82rem;
    color: #475569;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    border: none;
    background: none;
  }

  .cal-day:hover { background: #eff6ff; color: #3b82f6; }

  .cal-day.selected {
    background: #3b82f6;
    color: white;
    font-weight: 700;
  }

  .cal-day.today {
    border: 1.5px solid #3b82f6;
    color: #3b82f6;
    font-weight: 600;
  }

  .cal-day.empty { cursor: default; }
  .cal-day.empty:hover { background: none; }

  .cal-clear {
    margin-top: 10px;
    width: 100%;
    background: #f1f5f9;
    border: none;
    border-radius: 12px;
    padding: 7px;
    font-size: 0.82rem;
    color: #64748b;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
  }

  .cal-clear:hover { background: #e2e8f0; }

  .scroll-wrapper {
    flex: 1; overflow-y: auto; 
    background: #f8fafc; border-radius: 25px;
    padding: 0 15px 15px 15px;
  }

  .logs-grid-header {
    display: grid; grid-template-columns: 1fr 1fr 1.5fr;
    padding: 20px 0; 
    position: sticky; top: 0; 
    background: #f8fafc; 
    z-index: 10;
  }

  .column-label {
    font-weight: 600; font-size: 1rem; color: #334155; text-align: center;
  }

  .log-row {
    display: grid; grid-template-columns: 1fr 1fr 1.5fr;
    padding: 14px 0; border-radius: 15px; margin-bottom: 6px;
    background: transparent;
  }

  .log-row:nth-child(even) {
    background-color: white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  }

  .log-entry {
    font-size: 0.9rem; color: #64748b; text-align: center;
    display: flex; align-items: center; justify-content: center;
  }
`;

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarPicker({ value, onChange, onClose }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(value ? new Date(value).getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? new Date(value).getMonth() : today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    onClose();
  };

  const isSelected = (day) => {
    if (!value) return false;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === value;
  };

  const isToday = (day) => {
    return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  };

  const cells = [...Array(firstDay).fill(null), ...Array(daysInMonth).keys().map(i => i + 1)];

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
            ? <div key={`e-${i}`} className="cal-day empty" />
            : <button
                key={day}
                className={`cal-day${isSelected(day) ? ' selected' : ''}${isToday(day) && !isSelected(day) ? ' today' : ''}`}
                onClick={() => selectDay(day)}
              >{day}</button>
        )}
      </div>
      <button className="cal-clear" onClick={() => { onChange(''); onClose(); }}>Clear</button>
    </div>
  );
}

export default function SecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterCard, setFilterCard] = useState('');
  const [showCal, setShowCal] = useState(false);
  const calRef = useRef(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/security`);
        const sortedData = response.data.sort((a, b) =>
          new Date(b.receivedAt || b.timestamp) - new Date(a.receivedAt || a.timestamp)
        );
        setLogs(sortedData);
      } catch (error) {
        console.error("Error fetching security logs:", error);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e) => {
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatSLTime = (ts) => {
    if (!ts) return "N/A";
    const date = new Date(ts);
    return date.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Colombo'
    }).replace(',', '');
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Date';
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d)} ${MONTHS[parseInt(m) - 1].slice(0, 3)} ${y}`;
  };

  const uniqueCardIds = [...new Set(logs.map(log => log.card_id).filter(Boolean))];

  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.receivedAt || log.timestamp).toISOString().split('T')[0];
    const matchesDate = filterDate === '' || logDate === filterDate;
    const matchesCard = filterCard === '' || log.card_id === filterCard;
    return matchesDate && matchesCard;
  });

  return (
    <div className="logs-container">
      <style>{logStyles}</style>

      <div className="logs-header">
        <h2 style={{margin: 0, fontWeight: 800, color: '#1e293b'}}>Logs</h2>
        <div className="dropdown-group">

          {/* Card ID Filter */}
          <div style={{position: 'relative'}}>
            <select className="filter-select" value={filterCard} onChange={(e) => setFilterCard(e.target.value)}>
              <option value="">All Card IDs</option>
              {uniqueCardIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
            <span style={{position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6', pointerEvents: 'none'}}>▼</span>
          </div>

          {/* Date Filter with Custom Calendar */}
          <div style={{position: 'relative'}} ref={calRef}>
            <button className="date-btn" onClick={() => setShowCal(v => !v)}>
              <span style={{color: filterDate ? '#1e293b' : '#64748b'}}>{formatDisplayDate(filterDate)}</span>
              <span style={{color: '#3b82f6'}}>▼</span>
            </button>
            {showCal && (
              <CalendarPicker
                value={filterDate}
                onChange={setFilterDate}
                onClose={() => setShowCal(false)}
              />
            )}
          </div>

        </div>
      </div>

      <div className="scroll-wrapper">
        <div className="logs-grid-header">
          <div className="column-label">Time</div>
          <div className="column-label">Card Id</div>
          <div className="column-label">Details</div>
        </div>

        <div className="logs-body">
          {filteredLogs.map((log) => (
            <div key={log._id} className="log-row">
              <div className="log-entry">{formatSLTime(log.receivedAt || log.timestamp)}</div>
              <div className="log-entry">{log.card_id || "Unknown"}</div>
              <div className="log-entry" style={{fontWeight: 600, color: '#475569'}}>{log.status || "No Status"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}