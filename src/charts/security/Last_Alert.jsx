import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
// Import outlined icons
import { Lock, LockKeyholeOpen, AlertTriangle } from 'lucide-react';

const socket = io('http://localhost:5000');

const BRAND_BLUE = '#1e40af'; 
const WARN_ORANGE = '#ea0c0c';

export default function LockStatusCard() {
    const [status, setStatus] = useState("Loading...");
    const [lastTimeDisplay, setLastTimeDisplay] = useState("");

    const formatTimestamp = (ts) => {
        if (!ts) return "";
        const eventDate = new Date(ts);
        const now = new Date();
        const diffInMs = now - eventDate;
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

        if (diffInMs > twentyFourHoursInMs) {
            return eventDate.toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        } else {
            return eventDate.toLocaleTimeString([], { 
                hour: '2-digit', minute: '2-digit' 
            });
        }
    };

    useEffect(() => {
        fetch('http://localhost:5000/api/security')
            .then(res => res.json())
            .then(data => {
                if (data.length > 0) {
                    const latest = data[0];
                    setStatus(latest.status);
                    setLastTimeDisplay(formatTimestamp(latest.timestamp || latest.receivedAt));
                }
            })
            .catch(err => console.error("Fetch error:", err));

        socket.on('lockUpdate', (data) => {
            setStatus(data.status);
            setLastTimeDisplay(formatTimestamp(new Date()));
        });

        return () => socket.off('lockUpdate');
    }, []);

    const isLocked = status === "Locked" || status === "Close";
    const isDenied = status === "Denied" || status === "Access Denied";
    
    // Icon Selection Logic
    const renderIcon = () => {
        const iconProps = {
            size: 32,
            color: BRAND_BLUE, // All icons will be blue
            strokeWidth: 2     // Ensures a clear outline
        };

        if (isDenied) return <AlertTriangle {...iconProps} />;
        if (isLocked) return <Lock {...iconProps} />;
        return <LockKeyholeOpen {...iconProps} />;
    };

    return (
        <div style={styles.card}>
            <div>
                <p style={styles.title}>Security Lock</p>
                <h1 style={{
                    ...styles.status, 
                    color: isDenied ? WARN_ORANGE : (isLocked ? BRAND_BLUE : WARN_ORANGE)
                }}>
                    {status}
                </h1>
                <p style={styles.time}>Updated: {lastTimeDisplay}</p>
            </div>
            
            {/* Outline only - No background color */}
            <div style={styles.iconContainer}>
                {renderIcon()}
            </div>
        </div>
    );
}

const styles = {
    card: {
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontFamily: "'Poppins', sans-serif"
    },
    title: { margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' },
    status: { fontSize: '1.4rem', fontWeight: '700' },
    time: { margin: 0, color: '#94a3b8', fontSize: '0.8rem' },
    iconContainer: { 
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
        // Background removed as requested
    }
};