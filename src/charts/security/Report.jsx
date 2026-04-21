import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../route/api';

const analyticsStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;500;600;700;800&display=swap');

  .analytics-wrap { font-family: 'Poppins', sans-serif; height: 100%; display: flex; flex-direction: column; }

  .analytics-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  }

  .date-btn {
    background: white; border: 1px solid #f1f5f9; padding: 8px 16px;
    border-radius: 25px; font-size: 0.82rem; color: #64748b; cursor: pointer;
    outline: none; box-shadow: 0 2px 10px rgba(0,0,0,0.03); min-width: 140px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; font-family: 'Poppins', sans-serif;
  }

  .calendar-popup {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: white; border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    padding: 12px; z-index: 999; width: 220px;
  }

  .cal-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .cal-nav-btn { background: none; border: none; cursor: pointer; color: #3b82f6; font-size: 0.95rem; padding: 2px 6px; border-radius: 8px; }
  .cal-nav-btn:hover { background: #f1f5f9; }
  .cal-month-label { font-weight: 700; color: #1e293b; font-size: 0.82rem; font-family: 'Poppins', sans-serif; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .cal-day-name { text-align: center; font-size: 0.62rem; font-weight: 600; color: #94a3b8; padding: 3px 0; font-family: 'Poppins', sans-serif; }
  .cal-day { text-align: center; padding: 4px 0; border-radius: 50%; font-size: 0.72rem; color: #475569; cursor: pointer; font-family: 'Poppins', sans-serif; border: none; background: none; width: 100%; }
  .cal-day:hover { background: #eff6ff; color: #3b82f6; }
  .cal-day.selected { background: #3b82f6; color: white; font-weight: 700; }
  .cal-day.today { border: 1.5px solid #3b82f6; color: #3b82f6; font-weight: 600; }
  .cal-day.empty { cursor: default; }
  .cal-day.empty:hover { background: none; }
  .cal-clear { margin-top: 8px; width: 100%; background: #f1f5f9; border: none; border-radius: 10px; padding: 5px; font-size: 0.72rem; color: #64748b; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600; }
  .cal-clear:hover { background: #e2e8f0; }

  .analytics-table-wrap {
    flex: 1; overflow-y: auto; background: #f8fafc; border-radius: 20px; padding: 0 12px 12px 12px;
  }

  .analytics-table-header {
    display: grid; grid-template-columns: 1.5fr 1fr 1fr;
    padding: 16px 8px; position: sticky; top: 0;
    background: #f8fafc; z-index: 10;
  }

  .analytics-col-label {
    font-weight: 600; font-size: 0.85rem; color: #334155; text-align: center;
  }

  .analytics-category-row {
    display: grid; grid-template-columns: 1.5fr 1fr 1fr;
    padding: 12px 8px; border-radius: 12px; margin-bottom: 5px;
    background: transparent; cursor: pointer; transition: background 0.2s;
  }

  .analytics-category-row:hover { background: #eff6ff; }

  .analytics-cell {
    font-size: 0.82rem; color: #64748b; text-align: center;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }

  .detail-expand {
    background: white; border-radius: 16px; margin-bottom: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden;
    margin-top: 4px;
  }

  .detail-table-header {
    display: grid; padding: 10px 16px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;
  }

  .detail-row {
    display: grid; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.78rem;
  }

  .detail-row:nth-child(even) { background: white; }
  .detail-row:nth-child(odd)  { background: #f8fafc; }
  .detail-row:last-child { border-bottom: none; }

  .badge {
    padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600;
  }
  .badge-normal  { background: #f0fff4; color: #38a169; }
  .badge-anomaly { background: #fff5f5; color: #e53e3e; }
`;

const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarPicker({ value, onChange, onClose }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(value ? new Date(value).getFullYear()  : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? new Date(value).getMonth()     : today.getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0);  setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  const selectDay = (day) => {
    const s = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    onChange(s); onClose();
  };

  const isSelected = (day) => {
    if (!value) return false;
    return `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` === value;
  };
  const isToday = (day) => day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const cells = [...Array(firstDay).fill(null), ...[...Array(daysInMonth).keys()].map(i => i+1)];

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

const SecurityAnalytics = () => {
  const [logs, setLogs] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [showCal, setShowCal] = useState(false);
  const calRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/security`);
        setLogs(response.data.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)));
      } catch (err) { console.error("Error fetching logs:", err); }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Date';
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d)} ${MONTHS[parseInt(m)-1].slice(0,3)} ${y}`;
  };

  const dailyLogs = useMemo(() => {
    return logs.filter(log => new Date(log.receivedAt).toISOString().split('T')[0] === filterDate);
  }, [logs, filterDate]);

  const groupedData = useMemo(() => {
    return dailyLogs.reduce((acc, log) => {
      const type = log.anomaly || "None";
      if (!acc[type]) acc[type] = [];
      acc[type].push(log);
      return acc;
    }, {});
  }, [dailyLogs]);

  const getDuration = (unlockedLog, allLogs) => {
    if (unlockedLog.status !== 'Unlocked') return "---";
    const unlockedTime = new Date(unlockedLog.receivedAt);
    const nextLock = allLogs
      .filter(log => (log.status === 'Locked' || log.status === 'Automatic') && new Date(log.receivedAt) > unlockedTime)
      .sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt))[0];
    if (!nextLock) return <span style={{ color: '#e53e3e', fontWeight: 700, fontSize: '0.75rem' }}>Still Open</span>;
    const totalSeconds = Math.max(0, Math.floor((new Date(nextLock.receivedAt) - unlockedTime) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  return (
    <div className="analytics-wrap">
      <style>{analyticsStyles}</style>

      {/* Header */}
      <div className="analytics-header">
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Security Anomaly</div>
        <div style={{ position: 'relative', zIndex: 50 }} ref={calRef}>
          <button className="date-btn" onClick={() => setShowCal(v => !v)}>
            <span style={{ color: filterDate ? '#1e293b' : '#64748b' }}>{formatDisplayDate(filterDate)}</span>
            <span style={{ color: '#3b82f6' }}>▼</span>
          </button>
          {showCal && (
            <CalendarPicker value={filterDate} onChange={setFilterDate} onClose={() => setShowCal(false)} />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="analytics-table-wrap">

        {/* Sticky Column Headers */}
        <div className="analytics-table-header">
          <div className="analytics-col-label">Anomaly Category</div>
          <div className="analytics-col-label">Total Events</div>
          <div className="analytics-col-label">Action</div>
        </div>

        {/* Rows */}
        {Object.keys(groupedData).map((type, rowIndex) => {
          const isUnauth    = type === "Unauthorized Access";
          const sessionLogs = isUnauth ? groupedData[type] : groupedData[type].filter(l => l.status === 'Unlocked');
          const isExpanded  = expandedGroup === type;
          const isNormal    = type === "None";

          return (
            <React.Fragment key={type}>
              <div
                className="analytics-category-row"
                style={{
                  backgroundColor: rowIndex % 2 !== 0 ? 'white' : 'transparent',
                  boxShadow: rowIndex % 2 !== 0 ? '0 2px 5px rgba(0,0,0,0.02)' : 'none'
                }}
                onClick={() => setExpandedGroup(isExpanded ? null : type)}
              >
                {/* Category Name */}
                <div className="analytics-cell" style={{ justifyContent: 'flex-start', paddingLeft: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isNormal ? '#48bb78' : '#f56565', flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, color: '#2d3748', fontSize: '0.85rem' }}>
                    {isNormal ? 'Normal Access' : type}
                  </span>
                </div>

                {/* Count Badge */}
                <div className="analytics-cell">
                  <span className={`badge ${isNormal ? 'badge-normal' : 'badge-anomaly'}`}>
                    {sessionLogs.length} Records
                  </span>
                </div>

                {/* Action */}
                <div className="analytics-cell">
                  <span style={{ background: '#ebf8ff', color: '#3182ce', padding: '5px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                    {isExpanded ? 'CLOSE' : 'DETAILS'}
                  </span>
                </div>
              </div>

              {/* Expanded Detail Table */}
              {isExpanded && (
                <div className="detail-expand">
                  {/* Detail Header */}
                  <div
                    className="detail-table-header"
                    style={{ gridTemplateColumns: isUnauth ? '1fr 1fr' : '1fr 1fr 1fr' }}
                  >
                    {['TIME', 'CARD ID', ...(!isUnauth ? ['OPEN DURATION'] : [])].map(h => (
                      <div key={h} style={{ fontWeight: 600, fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center', letterSpacing: '0.05em' }}>{h}</div>
                    ))}
                  </div>

                  {/* Detail Rows */}
                  {sessionLogs.map(log => (
                    <div
                      key={log._id}
                      className="detail-row"
                      style={{ gridTemplateColumns: isUnauth ? '1fr 1fr' : '1fr 1fr 1fr' }}
                    >
                      <div style={{ textAlign: 'center', color: '#4a5568', fontWeight: 500, fontSize: '0.78rem' }}>
                        {new Date(log.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div style={{ textAlign: 'center', fontFamily: '"Courier New", monospace', color: '#2d3748', fontWeight: 700, fontSize: '0.78rem' }}>
                        {log.card_id || 'N/A'}
                      </div>
                      {!isUnauth && (
                        <div style={{ textAlign: 'center', color: '#1a202c', fontWeight: 400, fontSize: '0.78rem' }}>
                          {getDuration(log, dailyLogs)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default SecurityAnalytics;