import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import API_BASE_URL from '../../route/api';

const socket = io(`${API_BASE_URL}`);

const motionStyles = `
  .mr-live-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .mr-gauge-wrap {
    flex: 0 0 auto;
    width: clamp(130px, 40vw, 210px);
  }
  .mr-gauge-wrap svg {
    width: 100%;
    display: block;
  }
  .mr-stats {
    flex: 1;
    min-width: 0;
  }
  .mr-status-label {
    font-weight: 800;
    font-size: clamp(0.85rem, 2.5vw, 1.05rem);
    margin-bottom: 10px;
  }
  .mr-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px solid #f1f5f9;
    font-size: clamp(0.68rem, 2vw, 0.78rem);
    gap: 6px;
  }
  .mr-stat-label {
    color: #64748b;
    flex: 1;
    min-width: 0;
  }
  .mr-stat-value {
    flex-shrink: 0;
  }
  .mr-timestamp {
    font-size: clamp(0.6rem, 1.6vw, 0.68rem);
    color: #94a3b8;
    margin-top: 8px;
  }

  /* Summary grid: 2 cols normally, 1 col on very small screens */
  .mr-summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  @media (max-width: 320px) {
    .mr-summary-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Verdict banner */
  .mr-verdict {
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 14px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .mr-verdict-icon {
    font-size: clamp(0.95rem, 2.5vw, 1.1rem);
    flex-shrink: 0;
  }
  .mr-verdict-title {
    font-weight: 700;
    font-size: clamp(0.75rem, 2.2vw, 0.85rem);
    margin-bottom: 3px;
  }
  .mr-verdict-desc {
    font-size: clamp(0.65rem, 1.8vw, 0.72rem);
    color: #64748b;
    line-height: 1.4;
  }

  /* Breakdown bars */
  .mr-breakdown-row {
    margin-bottom: 6px;
  }
  .mr-breakdown-labels {
    display: flex;
    justify-content: space-between;
    font-size: clamp(0.62rem, 1.8vw, 0.7rem);
    margin-bottom: 3px;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export default function MotionReport() {
  const [motionData, setMotionData]   = useState(null);
  const [rollingRisk, setRollingRisk] = useState(0);
  const [allLogs, setAllLogs]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('gauge');

  useEffect(() => {
    const fetchMotion = async () => {
      try {
        const latest = await axios.get(`${API_BASE_URL}/api/motion/latest`);
        if (latest.data) {
          setMotionData(latest.data);
          setRollingRisk(latest.data.rolling_risk || latest.data.risk_score || 0);
        }
        const all = await axios.get(`${API_BASE_URL}/api/motion`);
        if (all.data) setAllLogs(all.data.slice().reverse());
        setLoading(false);
      } catch (e) {
        console.error('Error fetching motion data', e);
        setLoading(false);
      }
    };

    fetchMotion();

    socket.on('motionUpdate', (data) => {
      setMotionData(data);
      setRollingRisk(data.rolling_risk || data.risk_score || 0);
      setAllLogs(prev => [...prev, data].slice(-200));
    });

    return () => socket.off('motionUpdate');
  }, []);

  if (loading) return <p style={{ padding: '20px', color: '#64748b' }}>Loading...</p>;
  if (!motionData) return <p style={{ padding: '20px', color: '#64748b' }}>No Motion Data Available</p>;

  const score       = rollingRisk;
  const confidence  = motionData.ml_conf    || 0;
  const mlClass     = motionData.ml_class   || 'Stable';
  const timestamp   = motionData.time       || 'Unknown';
  const currentRisk = motionData.risk_score || 0;

  const totalReadings = allLogs.length;
  const stableCount   = allLogs.filter(l => l.ml_class === 'Stable').length;
  const moderateCount = allLogs.filter(l => l.ml_class === 'Moderate Vibration').length;
  const highCount     = allLogs.filter(l => l.ml_class === 'High Vibration').length;
  const criticalCount = allLogs.filter(l => l.ml_class === 'Critical Shock').length;
  const stablePct     = totalReadings > 0 ? Math.round((stableCount / totalReadings) * 100) : 0;
  const worstEvent    = criticalCount > 0 ? 'Critical Shock'
                      : highCount     > 0 ? 'High Vibration'
                      : moderateCount > 0 ? 'Moderate Vibration'
                      : 'Stable';
  const worstRiskScore = allLogs.length > 0
    ? Math.max(...allLogs.map(l => l.risk_score || 0))
    : 0;

  const getVerdict = () => {
    if (criticalCount > 0 || worstRiskScore >= 90 || score >= 70) return {
      label: 'Compromised',
      desc:  'Critical shock detected. Medicine safety cannot be guaranteed.',
      color: '#dc2626', bg: '#fef2f2', border: '#fecaca'
    };
    if (highCount > 2 || score >= 40) return {
      label: 'Use with Caution',
      desc:  'Significant vibration detected. Inspect before use.',
      color: '#ea580c', bg: '#fff7ed', border: '#fed7aa'
    };
    return {
      label: 'Safe',
      desc:  'Medicine transported within acceptable vibration limits.',
      color: '#3182ce', bg: '#f0f7fd', border: '#aabef5'
    };
  };

  const verdict = getVerdict();

  const getRiskLabel = (s) => {
    if (s < 30) return 'LOW RISK';
    if (s < 70) return 'MODERATE RISK';
    return 'HIGH RISK';
  };

  const getStatusColor = (cls) => {
    if (cls === 'Stable')             return '#3182ce';
    if (cls === 'Moderate Vibration') return '#ea580c';
    if (cls === 'High Vibration')     return '#dc2626';
    if (cls === 'Critical Shock')     return '#991b1b';
    return '#64748b';
  };

  // Gauge geometry
  const cx = 110, cy = 120, r = 85;
  const needleAngle = 180 + (score / 100) * 180;
  const needleRad   = (needleAngle * Math.PI) / 180;

  const segments = [
    { start: 180, end: 216, color: '#bfdbfe' },
    { start: 216, end: 252, color: '#93c5fd' },
    { start: 252, end: 288, color: '#60a5fa' },
    { start: 288, end: 324, color: '#3b82f6' },
    { start: 324, end: 360, color: '#1d4ed8' },
  ];

  const polarToCartesian = (cx, cy, r, deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, s, e) => {
    const sp = polarToCartesian(cx, cy, r, s);
    const ep = polarToCartesian(cx, cy, r, e);
    return `M ${sp.x} ${sp.y} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 1 ${ep.x} ${ep.y}`;
  };

  const tipX   = cx + 75 * Math.cos(needleRad);
  const tipY   = cy + 75 * Math.sin(needleRad);
  const leftX  = cx + 8  * Math.cos(needleRad - Math.PI / 2);
  const leftY  = cy + 8  * Math.sin(needleRad - Math.PI / 2);
  const rightX = cx + 8  * Math.cos(needleRad + Math.PI / 2);
  const rightY = cy + 8  * Math.sin(needleRad + Math.PI / 2);

  const tabs = [
    { key: 'gauge',   label: 'Live' },
    { key: 'summary', label: 'Summary' },
  ];

  return (
    <>
      <style>{motionStyles}</style>

      {/* Title */}
      <h2 className="card-title" style={{ margin: '0 0 12px 0' }}>
        Transport Risk Level
      </h2>

      {/* Tab navigation */}
      <div style={{
        display: 'flex', gap: '4px',
        background: '#f1f5f9', borderRadius: '10px',
        padding: '3px', marginBottom: '16px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '6px 4px', border: 'none',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.2s',
              background: activeTab === tab.key ? '#ffffff' : 'transparent',
              color:      activeTab === tab.key ? '#1e40af' : '#94a3b8',
              boxShadow:  activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Live gauge ── */}
      {activeTab === 'gauge' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="mr-live-row">

            {/* LEFT: Gauge — fluid width via clamp() in CSS */}
            <div className="mr-gauge-wrap">
              <svg viewBox="0 0 220 150">
                {segments.map((seg, i) => (
                  <path
                    key={i}
                    d={describeArc(cx, cy, r, seg.start, seg.end - 2)}
                    fill="none" stroke={seg.color}
                    strokeWidth="22" strokeLinecap="butt"
                  />
                ))}
                <polygon
                  points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
                  fill="#1e293b"
                  style={{ transition: 'all 0.8s ease-out' }}
                />
                <circle cx={cx} cy={cy} r="9" fill="#1e293b" />
                <circle cx={cx} cy={cy} r="4" fill="white" />
                <text x="14"  y="145" fontSize="10" fill="#64748b" fontWeight="500">Safe</text>
                <text x="182" y="145" fontSize="10" fill="#64748b" fontWeight="500">High</text>
                <text x={cx} y="104" fontSize="24" fontWeight="800" fill="#1e40af" textAnchor="middle">
                  {Math.round(score)}%
                </text>
                <text x={cx} y="118" fontSize="9" fontWeight="700" fill="#1e40af" textAnchor="middle" letterSpacing="0.5">
                  {getRiskLabel(score)}
                </text>
              </svg>
            </div>

            {/* RIGHT: Status + Stats */}
            <div className="mr-stats">
              <div className="mr-status-label" style={{ color: getStatusColor(mlClass) }}>
                {mlClass}
              </div>

              {[
                { label: 'Current risk',                value: `${currentRisk}%`,           color: getStatusColor(mlClass) },
                { label: 'Final medicine box condition', value: `${Math.round(score)}%`,     color: '#3b82f6' },
                { label: 'AI Confidence',               value: `${confidence.toFixed(1)}%`, color: '#1e293b' },
              ].map(({ label, value, color }) => (
                <div key={label} className="mr-stat-row">
                  <span className="mr-stat-label">{label}</span>
                  <strong className="mr-stat-value" style={{ color }}>{value}</strong>
                </div>
              ))}

              <div className="mr-timestamp">Last updated: {timestamp}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Trip summary ── */}
      {activeTab === 'summary' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>

          {/* Verdict banner */}
          <div
            className="mr-verdict"
            style={{ background: verdict.bg, border: `1px solid ${verdict.border}` }}
          >
            <span className="mr-verdict-icon">{verdict.icon}</span>
            <div>
              <div className="mr-verdict-title" style={{ color: verdict.color }}>
                Medicine Condition: {verdict.label}
              </div>
              <div className="mr-verdict-desc">{verdict.desc}</div>
            </div>
          </div>

          {/* Summary grid */}
          <div className="mr-summary-grid">
            {[
              { label: 'Total readings',  value: totalReadings,   color: '#1e293b', bg: '#f8fafc' },
              { label: 'Time stable',     value: `${stablePct}%`, color: '#3182ce', bg: '#f8fafc' },
              { label: 'Worst event',     value: worstEvent,      color: getStatusColor(worstEvent), bg: '#fef2f2', small: true },
              { label: 'Critical shocks', value: criticalCount,   color: criticalCount > 0 ? '#dc2626' : '#94a3b8', bg: criticalCount > 0 ? '#fef2f2' : '#f8fafc' },
            ].map(({ label, value, color, bg, small }) => (
              <div key={label} style={{ background: bg, borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: 'clamp(0.58rem, 1.6vw, 0.65rem)', color: '#94a3b8', marginBottom: '4px' }}>
                  {label}
                </div>
                <div style={{
                  fontSize: small ? 'clamp(0.68rem, 2vw, 0.75rem)' : 'clamp(0.9rem, 2.8vw, 1.1rem)',
                  fontWeight: 700, color
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Class breakdown */}
          <div style={{ marginTop: '12px' }}>
            {[
              { label: 'Stable',             count: stableCount,   color: '#16a34a' },
              { label: 'Moderate Vibration', count: moderateCount, color: '#ea580c' },
              { label: 'High Vibration',     count: highCount,     color: '#dc2626' },
              { label: 'Critical Shock',     count: criticalCount, color: '#991b1b' },
            ].map(({ label, count, color }) => {
              const pct = totalReadings > 0 ? Math.round((count / totalReadings) * 100) : 0;
              return (
                <div key={label} className="mr-breakdown-row">
                  <div className="mr-breakdown-labels">
                    <span style={{ color: '#64748b' }}>{label}</span>
                    <span style={{ color, fontWeight: 600 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '5px' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: color, borderRadius: '99px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}