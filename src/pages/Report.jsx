import React from 'react';
import Navbar from '../assets/Navigation';
import TempReport from '../charts/temperature/TempReport';
import Chatbot from './Chatbot';
import Security from '../charts/security/Report';
import MotionReport from '../charts/motion/MotionReport';

const reportStyles = `
  .report-root {
    background-color: #f0f4f8;
    height: calc(100vh - 60px); /* Fits exactly below Navbar */
    padding: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  .report-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr; /* 2x2 grid to fill screen */
    gap: 15px;
    width: 100%;
    height: 100%;
  }

  .report-card {
    background: white;
    border-radius: 20px;
    padding: 15px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 10px 0;
  }

  /* Table Styling */
  .anomaly-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 5px;
    flex: 1;
  }

  .table-header {
    background: #f8fafc;
    font-size: 0.75rem;
    color: #64748b;
    padding: 8px;
    border-radius: 8px;
    text-align: center;
  }

  .table-cell {
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    padding: 8px;
    font-size: 0.8rem;
    text-align: center;
    background: white;
  }

  .detail-box {
    background: #f8fafc;
    border-radius: 8px;
    padding: 5px;
    font-size: 0.75rem;
    line-height: 1.4;
  }

  /* Image/Chart Containers */
  .chart-container {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .chart-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  /* Gauge Component */
  .risk-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .gauge-svg { width: 180px; height: auto; }

  .risk-value {
    font-size: 2.2rem;
    font-weight: 700;
    color: #2d82cc;
    margin-top: -15px;
  }

  .risk-status {
    font-weight: 600;
    color: #1e3a6e;
    text-transform: uppercase;
    font-size: 0.9rem;
  }

  .risk-footer {
    margin-top: 10px;
    font-size: 0.8rem;
    color: #64748b;
  }
`;

export default function Report() {
  return (
    <>
      <style>{reportStyles}</style>
      <Navbar />
      <div className="report-root">
        <div className="report-grid">

          {/* 1. Safety Anomalies */}
          <div className="report-card">
            <Security/>
          </div>

          {/* 2. Humidity Trend */}
          <div className="report-card">
            <h2 className="card-title">Humidity Trend</h2>
            <div className="chart-container">
              <img
                src="https://i.imgur.com/GisLhOQ.png"
                className="chart-img"
                alt="Humidity Graph"
              />
            </div>
          </div>

          {/* 3. Temperature Trend */}
          <div className="report-card">
            <TempReport />
          </div>

          {/* 4. Transport Risk Level */}
          <div className="report-card">
            <MotionReport />
          </div>

        </div>
        <Chatbot />
      </div>
    </>
  );
}