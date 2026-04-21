import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Activity } from 'lucide-react';
import API_BASE_URL from '../../route/api';

const socket = io(`${API_BASE_URL}`, {
  transports: ['websocket'],
  autoConnect: true
});

const BRAND_BLUE  = '#3182ce';
const WARN_RED    = '#ea0c0c';
const WARN_ORANGE = '#d97706';

export default function LastAlert() {
  const [motionData, setMotionData] = useState({
    status: 'Waiting...',
    serverTimestamp: null,
    isOnline: false
  });
  const [displayTime, setDisplayTime] = useState('No Data');

  const getTimeAgo = (date) => {
    if (!date) return 'No Data';
    const formattedDate = typeof date === 'string' ? date.replace(' ', 'T') : date;
    const parsedDate = new Date(formattedDate);
    if (isNaN(parsedDate)) return 'Invalid Date';
    const seconds = Math.floor((new Date() - parsedDate) / 1000);
    if (seconds < 0)  return 'Just now';
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    return minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)} hours ago`;
  };

  const fetchInitialData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/motion/latest`);
      if (response.data) {
        setMotionData({
          status: response.data.status || 'Stable',
          serverTimestamp: response.data.time || response.data.createdAt,
          isOnline: true
        });
      }
    } catch (err) {
      console.error('Initial fetch failed:', err);
      setMotionData(prev => ({ ...prev, isOnline: false }));
    }
  };

  useEffect(() => {
    fetchInitialData();

    socket.on('connect',       () => setMotionData(prev => ({ ...prev, isOnline: true })));
    socket.on('connect_error', () => setMotionData(prev => ({ ...prev, isOnline: false })));
    socket.on('motionUpdate', (newData) => {
      setMotionData({
        status: newData.status || 'Active',
        serverTimestamp: newData.time ? newData.time.replace(' ', 'T') : new Date(),
        isOnline: true
      });
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('motionUpdate');
    };
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setDisplayTime(getTimeAgo(motionData.serverTimestamp));
    }, 1000);
    return () => clearInterval(timeInterval);
  }, [motionData.serverTimestamp]);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('critical') || s.includes('high')) return WARN_RED;
    if (s.includes('moderate')) return WARN_ORANGE;
    return BRAND_BLUE;
  };

  const statusColor = getStatusColor(motionData.status);

  return (
    <>
      <style>{`
        .last-alert-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Poppins', sans-serif;
          gap: 8px;
          flex-wrap: nowrap;
          min-width: 0;
        }
        .last-alert-text {
          flex: 1;
          min-width: 0;
        }
        .last-alert-title {
          margin: 0;
          color: #64748b;
          font-size: clamp(0.75rem, 2vw, 0.9rem);
          font-weight: 500;
        }
        .last-alert-status {
          margin: 2px 0;
          font-size: clamp(1rem, 3.5vw, 1.4rem);
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .last-alert-time {
          margin: 0;
          color: #94a3b8;
          font-size: clamp(0.65rem, 1.8vw, 0.8rem);
          white-space: nowrap;
        }
        .last-alert-icon {
          flex-shrink: 0;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 360px) {
          .last-alert-icon svg {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>

      <div className="last-alert-card">
        <div className="last-alert-text">
          <p className="last-alert-title">Vibration</p>
          <h1 className="last-alert-status" style={{ color: statusColor }}>
            {motionData.status}
          </h1>
          <p className="last-alert-time">
            Updated: {displayTime}
            {!motionData.isOnline && (
              <span style={{ color: 'red', fontSize: '10px' }}> (Offline)</span>
            )}
          </p>
        </div>

        <div className="last-alert-icon">
          <Activity size={32} color={statusColor} strokeWidth={2} />
        </div>
      </div>
    </>
  );
}