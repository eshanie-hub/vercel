import React, { useEffect, useState } from 'react';
import { io } from "socket.io-client";
import Navbar from '../assets/Navigation';
import LastAlert from '../charts/motion/Last_Alert';
import LockStatusCard from '../charts/security/Last_Alert';
import TempLastAlert from '../charts/temperature/Last_Alert';
import HumLastAlert from '../charts/humidity/Last_Alert';
import RouteMap from '../assets/RouteMap';
import Chatbot from './Chatbot';
import API_BASE_URL from '../route/api';

// Initialize Socket outside to prevent multiple connections
const socket = io(`${API_BASE_URL}`);

const pageStyles = `
  .dashboard-root { background-color: #f0f4f8; height: calc(100vh - 60px); padding: 15px; display: flex; gap: 15px; }
  .sidebar { width: 250px; display: flex; flex-direction: column; gap: 10px; }
  .sidebar-card { background: white; border-radius: 12px; padding: 12px 18px; flex: 1; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .map-container { flex: 1; background: white; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; text-align: center; }
  .route-btn { border: none; border-radius: 12px; padding: 10px 16px; font-weight: 700; cursor: pointer; color: white; min-width: 125px; transition: 0.2s; }
  .route-btn.start { background: #16a34a; }
  .route-btn.end { background: #dc2626; }
  
  /* Popup Styles */
  .alert-popup {
    position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
    background: white; padding: 25px; border-radius: 15px; z-index: 9999;
    box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 3px solid #1e3a6e; text-align: center;
    animation: slideDown 0.3s ease-out;
  }
  @keyframes slideDown { from { top: -50px; opacity: 0; } to { top: 100px; opacity: 1; } }
  .btn-yes { padding: 10px 25px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
  .btn-no { padding: 10px 25px; background: #64748b; color: white; border: none; border-radius: 8px; cursor: pointer; }

  .status-label { font-size: 0.8rem; color: #64748b; }
  .status-value { font-size: 1.4rem; font-weight: 700; color: #1e3a6e; }
  .status-sub { font-size: 0.75rem; color: #a0aec0; }
  
      /* Vibration Status Colors */
  .status-critical { color: #e53e3e !important; font-weight: 800; }
  .status-warning { color: #dd6b20 !important; }
  .status-stable { color: #3182ce!important; font-weight: 700; }

  
`;

export default function Driver() {
  const [activeRoute, setActiveRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showLockPopup, setShowLockPopup] = useState(false);

  useEffect(() => {
    fetchCurrentRoute();

    // Listen for Lock Request from Backend
    socket.on("requestLockUI", () => {
        setShowLockPopup(true);
    });

    // ADD THIS: Hide popup if locked via RFID
    socket.on("clearLockUI", () => {
        setShowLockPopup(false);
    });

    return () => {
        socket.off("requestLockUI");
        socket.off("clearLockUI");
    };
}, []);

  const fetchCurrentRoute = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/route/current`);
      const data = await res.json();
      if (res.ok) setActiveRoute(data);
    } catch (err) { console.error('Route fetch failed:', err); }
  };

  const handleLockResponse = (choice) => {
    if (choice === "yes") {
        socket.emit("uiLockResponse", "yes");
    }
    setShowLockPopup(false);
  };

  const handleRouteToggle = async () => {
    setLoadingRoute(true);
    const endpoint = activeRoute ? '/api/route/end' : '/api/route/start';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setActiveRoute(activeRoute ? null : data.route);
    } catch (err) { alert(err.message); }
    setLoadingRoute(false);
  };

  return (
    <>
      <style>{pageStyles}</style>
      
      {/* 🔒 INTERACTIVE SECURITY ALERT POPUP */}
      {showLockPopup && (
        <div className="alert-popup">
          <h3 style={{ color: '#1e3a6e', margin: '0 0 10px 0' }}>📦 Box Closed</h3>
          <p>The MediPORT lid is closed. Would you like to lock the box now?</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
            <button className="btn-yes" onClick={() => handleLockResponse("yes")}>Yes, Lock</button>
            <button className="btn-no" onClick={() => handleLockResponse("no")}>Not Now</button>
          </div>
        </div>
      )}

      <Navbar />
      <div className="dashboard-root">
        <aside className="sidebar">
          <div className="sidebar-card"><LockStatusCard /></div>
          <div className="sidebar-card"><TempLastAlert /></div>
          <div className="sidebar-card"><LastAlert /></div>
          <div className="sidebar-card"><HumLastAlert /></div>
          <div className="sidebar-card">
            <span style={{ fontSize: '0.8rem', color: '#718096' }}>System Status</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#16a34a' }}>Online</span>
          </div>
        </aside>

        <main className="map-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Route Optimization</h2>
              <span style={{ color: '#64748b' }}>{activeRoute ? `Active ID: ${activeRoute.route_id}` : 'No active route'}</span>
            </div>
            <button className={`route-btn ${activeRoute ? 'end' : 'start'}`} onClick={handleRouteToggle} disabled={loadingRoute}>
              {loadingRoute ? 'Waiting...' : activeRoute ? 'End Route' : 'Start Route'}
            </button>
          </div>
          <div style={{ flex: 1, borderRadius: '25px', overflow: 'hidden' }}>
            <RouteMap activeRoute={activeRoute} />
          </div>
        </main>
        <Chatbot />
      </div>
    </>
  );
}