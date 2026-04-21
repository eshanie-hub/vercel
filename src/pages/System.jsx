import React, { useState } from 'react';
import Navbar from '../assets/Navigation';
import SecurityLogs from '../charts/security/Logs';
import LastAlert from '../charts/motion/Last_Alert';
import MotionLogs from '../charts/motion/Logs';
import LockStatusCard from '../charts/security/Last_Alert';
import TempLastAlert from '../charts/temperature/Last_Alert';
import HumLastAlert from '../charts/humidity/Last_Alert';
import TemperatureLogs from '../charts/temperature/Logs';
import HumidityLogs from '../charts/humidity/Logs';
import Chatbot from './Chatbot';

const systemStyles = `
  .system-root {
    height: calc(100vh - 60px);
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .sensor-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr); /* UI Kept exactly the same */
    gap: 15px;
    height: 120px;
  }

  .sensor-box {
    background: white;
    border-radius: 15px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .status-label { font-size: 0.8rem; color: #64748b; }
  .status-value { font-size: 1.4rem; font-weight: 700; color: #1e3a6e; }
  .status-sub { font-size: 0.75rem; color: #a0aec0; }
  .fan-btn { font-size: 0.7rem; color: #3182ce; margin-top: 5px; cursor: pointer; }


  .bottom-split {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 15px;
    min-height: 0;
  }

  .panel {
    background: white;
    border-radius: 15px;
    padding: 20px;
    overflow-y: auto;
  }
      /* Vibration Status Colors */
  .status-critical { color: #e53e3e !important; font-weight: 800; }
  .status-warning { color: #dd6b20 !important; }
  .status-stable { color: #3182ce!important; font-weight: 700; }

  .log-table { width: 100%; border-collapse: collapse; text-align: left; }
  .log-table td { padding: 10px 5px; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }

  .tab-header {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 10px;
  }

  .tab-btn {
    padding: 6px 12px;
    border-radius: 8px;
    border: none;
    background: #f8fafc;
    color: #64748b;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .tab-btn.active {
    background: #2d82cc;
    color: white;
  }

  .panel-title {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 15px;
    color: #1e3a6e;
  }
`;

export default function System() {


  //  Initialize state to track active log
  const [activeLog, setActiveLog] = useState('Security');

  // render the correct component
  const renderLogTable = () => {
    switch(activeLog) {
      case 'Security': return <SecurityLogs />;
      case 'Motion': return <MotionLogs />;
      case 'Temperature': return <TemperatureLogs />;
      case 'Humidity': return <HumidityLogs />;
      default: return null;
      
      
    }
  };

  return (
    <>
      <style>{systemStyles}</style>
      <Navbar />
      <div className="system-root">
        <div className="sensor-row">
          
          {/* Card 1: Security */}
          <div className="sensor-box">
            <LockStatusCard />
          </div>

          {/* Card 2: Temperature */}
          <div className="sensor-box">
            <TempLastAlert />
          </div>

          {/* Card 3: Vibration  */}
          <div className="sensor-box">
            <LastAlert />
          </div>

          {/* Card 4: Humidity */}
          <div className="sensor-box">
            <HumLastAlert />
          </div>

          {/* Card 5: Wifi */}
          <div className="sensor-box">
            <span style={{fontSize: '0.8rem', color: '#64748b'}}>Wifi</span>
            <span style={{fontSize: '1.3rem', fontWeight: 700, color: '#2d82cc'}}>Active</span>
          </div>

        </div>

        <div className="bottom-split">
          <div className="panel">
            {/* 3. Tab Navigation */}
            <div className="tab-header">
              {['Security', 'Motion','Temperature','Humidity'].map((type) => (
                <button 
                  key={type}
                  className={`tab-btn ${activeLog === type ? 'active' : ''}`}
                  onClick={() => setActiveLog(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {/* 4. Dynamic Log Content */}
            {renderLogTable()}
          </div>
          <div className="panel">
            <h3>Sensor Live status line chart</h3>
            <img src="https://i.imgur.com/GisLhOQ.png" style={{width: '100%', borderRadius: '10px'}} alt="Chart" />
          </div>
        </div>
        <Chatbot />
      </div>
    </>
  );
}