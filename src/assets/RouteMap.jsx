import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

import {
  Navigation, MapPin, Flag, Search, ChevronUp, ChevronDown,
  Locate, RotateCcw, Clock, Milestone, ArrowUp, ArrowUpLeft,
  ArrowUpRight, CircleDot, ChevronRight, Route, Car,
} from 'lucide-react';

// ── Fix default marker icons ──────────────────────────────────────────────────
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon, shadowUrl: iconShadow,
  iconSize: [25, 41], iconAnchor: [12, 41],
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const haversine = (a, b) => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

const parseInstruction = (text = '') => {
  const t = text.toLowerCase();
  if (t.includes('left'))   return { label: text, icon: 'left' };
  if (t.includes('right'))  return { label: text, icon: 'right' };
  if (t.includes('arrive')) return { label: text, icon: 'arrive' };
  return { label: text, icon: 'straight' };
};

const TurnIcon = ({ type, size = 20, color = '#fff' }) => {
  const p = { size, color, strokeWidth: 2.5 };
  if (type === 'left')   return <ArrowUpLeft {...p} />;
  if (type === 'right')  return <ArrowUpRight {...p} />;
  if (type === 'arrive') return <Flag {...p} />;
  return <ArrowUp {...p} />;
};

const geocode = async (place) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place + ', Sri Lanka')}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  if (!data.length) throw new Error(`"${place}" not found`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
};

const driverIcon = L.divIcon({
  className: '',
  html: `<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#15803d);border:3px solid #fff;box-shadow:0 3px 12px rgba(22,163,74,0.5);display:flex;align-items:center;justify-content:center;">
    <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polygon points='3 11 22 2 13 21 11 13 3 11'/></svg>
  </div>`,
  iconSize: [38, 38], iconAnchor: [19, 19],
});

// ── Routing + GPS tracking ────────────────────────────────────────────────────
const RoutingControl = ({ start, end, onRouteFound, onStepUpdate }) => {
  const map = useMap();
  const controlRef  = useRef(null);
  const stepsRef    = useRef([]);
  const watchRef    = useRef(null);
  const driverRef   = useRef(null);

  useEffect(() => {
    if (!map || !start || !end) return;
    if (controlRef.current) { map.removeControl(controlRef.current); controlRef.current = null; }

    controlRef.current = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      lineOptions: { styles: [{ color: '#16a34a', weight: 6, opacity: 0.85 }] },
      addWaypoints: false, draggableWaypoints: false,
      fitSelectedRoutes: true, show: false,
      router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
    })
      .on('routesfound', (e) => {
        const route = e.routes[0];
        stepsRef.current = route.instructions || [];
        onRouteFound({
          distance: (route.summary.totalDistance / 1000).toFixed(1),
          time: Math.round(route.summary.totalTime / 60),
          steps: route.instructions || [],
        });
        if (navigator.geolocation) {
          watchRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              const dp = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              if (!driverRef.current) {
                driverRef.current = L.marker([dp.lat, dp.lng], { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);
              } else {
                driverRef.current.setLatLng([dp.lat, dp.lng]);
              }
              map.panTo([dp.lat, dp.lng], { animate: true, duration: 1 });
              const steps = stepsRef.current;
              let ni = 0, nd = Infinity;
              steps.forEach((s, i) => {
                if (!s.waypoint) return;
                const d = haversine(dp, { lat: s.waypoint.lat, lng: s.waypoint.lng });
                if (d < nd) { nd = d; ni = i; }
              });
              onStepUpdate({ current: steps[ni], next: steps[ni + 1], distToNext: Math.round(nd) });
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
          );
        }
      })
      .addTo(map);

    return () => {
      if (controlRef.current) { map.removeControl(controlRef.current); controlRef.current = null; }
      if (watchRef.current)   { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      if (driverRef.current)  { driverRef.current.remove(); driverRef.current = null; }
    };
  }, [map, start, end]);

  return null;
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function RouteMap() {
  const SL_CENTER = [7.8731, 80.7718];
  const SL_BOUNDS = [[5.9, 79.5], [9.9, 82.0]];

  const [startInput, setStartInput] = useState('');
  const [endInput,   setEndInput]   = useState('');
  const [startPos,   setStartPos]   = useState(null);
  const [endPos,     setEndPos]     = useState(null);
  const [routeInfo,  setRouteInfo]  = useState(null);
  const [stepInfo,   setStepInfo]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [panelOpen,  setPanelOpen]  = useState(true);
  const [sideOpen,   setSideOpen]   = useState(true);

  const hasRoute = !!(startPos && endPos);
  const parsed   = stepInfo?.current ? parseInstruction(stepInfo.current.text) : null;

  const handleGetRoute = async () => {
    if (!startInput.trim() || !endInput.trim()) { setError('Please enter both locations.'); return; }
    setLoading(true); setError('');
    setRouteInfo(null); setStepInfo(null); setStartPos(null); setEndPos(null);
    try {
      const [s, e] = await Promise.all([geocode(startInput), geocode(endInput)]);
      setStartPos(s); setEndPos(e);
      setPanelOpen(false);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    setStartPos(null); setEndPos(null); setRouteInfo(null); setStepInfo(null);
    setStartInput(''); setEndInput(''); setError(''); setPanelOpen(true); setSideOpen(true);
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: 'flex' }}>

      {/* ════════════════ RIGHT SIDEBAR PANEL ════════════════ */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: sideOpen ? 300 : 0,
        zIndex: 1000,
        transition: 'width 0.35s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f1923 0%, #111d2c 100%)',
        boxShadow: '-6px 0 32px rgba(0,0,0,0.35)',
      }}>
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* ── Search inputs ── */}
          <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
            {/* Start */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.06)', borderRadius: 12,
              padding: '10px 14px', marginBottom: 8,
              border: '1.5px solid rgba(255,255,255,0.08)',
              transition: 'border-color 0.2s',
            }}>
              <CircleDot size={15} color="#4ade80" />
              <input
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1, color: '#fff' }}
                placeholder="Start location…"
                value={startInput}
                onChange={e => setStartInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGetRoute()}
              />
            </div>

            {/* Vertical connector */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 22, marginBottom: 2 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 2, height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginRight: 2 }} />)}
            </div>

            {/* End */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.06)', borderRadius: 12,
              padding: '10px 14px', marginBottom: 12,
              border: '1.5px solid rgba(255,255,255,0.08)',
            }}>
              <Flag size={15} color="#f87171" />
              <input
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1, color: '#fff' }}
                placeholder="Destination…"
                value={endInput}
                onChange={e => setEndInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGetRoute()}
              />
            </div>

            {error && <p style={{ margin: '0 0 8px', color: '#f87171', fontSize: 12 }}>⚠ {error}</p>}

            <button
              onClick={handleGetRoute}
              disabled={loading}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
                background: loading ? 'rgba(22,163,74,0.4)' : 'linear-gradient(135deg,#16a34a,#15803d)',
                color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(22,163,74,0.4)',
                marginBottom: 12, transition: 'all 0.2s',
              }}
            >
              <Search size={15} />
              {loading ? 'Finding route…' : 'Get Route'}
            </button>
          </div>

          {/* ── Route summary cards ── */}
          {routeInfo && (
            <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 8, marginBottom: 12,
              }}>
                {[
                  { icon: <Milestone size={14} color="#4ade80" />, val: `${routeInfo.distance} km`, label: 'Distance' },
                  { icon: <Clock size={14} color="#60a5fa" />,     val: `${routeInfo.time} min`,    label: 'Est. Time' },
                ].map(({ icon, val, label }) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.06)', borderRadius: 12,
                    padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>{icon}<span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{label}</span></div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Route waypoints */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CircleDot size={12} color="#4ade80" />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{startInput}</span>
                </div>
                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', marginLeft: 5, marginBottom: 8 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flag size={12} color="#f87171" />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{endInput}</span>
                </div>
              </div>

              {/* Reset */}
              <button onClick={handleReset} style={{
                width: '100%', padding: '9px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <RotateCcw size={13} /> New Route
              </button>
            </div>
          )}

          {/* ── DRIVER HUD ── */}
          {hasRoute && (
            <div style={{
              margin: '0 16px 16px', borderRadius: 16, overflow: 'hidden',
              border: '1px solid rgba(22,163,74,0.3)',
              background: 'linear-gradient(135deg, rgba(22,163,74,0.18), rgba(21,128,61,0.08))',
              flexShrink: 0,
            }}>
              {/* Current turn */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg,#16a34a,#15803d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(22,163,74,0.4)',
                }}>
                  <TurnIcon type={parsed?.icon ?? 'straight'} size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#fff', fontWeight: 700, fontSize: 13,
                    lineHeight: 1.4, marginBottom: 4,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {parsed?.label ?? 'Follow the green route'}
                  </div>
                  {stepInfo?.distToNext != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#4ade80', fontSize: 11, fontWeight: 600 }}>
                      <Locate size={11} />
                      {stepInfo.distToNext < 1000
                        ? `${stepInfo.distToNext} m away`
                        : `${(stepInfo.distToNext / 1000).toFixed(1)} km away`}
                    </div>
                  )}
                </div>
              </div>

              {/* Next step */}
              {stepInfo?.next && (
                <div style={{
                  padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <TurnIcon type={parseInstruction(stepInfo.next.text).icon} size={14} color="rgba(255,255,255,0.6)" />
                  </div>
                  <div style={{
                    color: 'rgba(255,255,255,0.55)', fontSize: 11, flex: 1,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>
                    Then: {stepInfo.next.text}
                  </div>
                  <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
                </div>
              )}

              {/* GPS status */}
              <div style={{
                padding: '8px 16px 12px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 8px #4ade80',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.5px' }}>
                  GPS TRACKING ACTIVE
                </span>
              </div>
            </div>
          )}

          {/* ── Steps list ── */}
          {routeInfo?.steps?.length > 0 && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: '1px', marginBottom: 10 }}>
                TURN-BY-TURN
              </div>
              {routeInfo.steps.map((step, i) => {
                const p = parseInstruction(step.text);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      background: i === 0 ? 'rgba(22,163,74,0.3)' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                    }}>
                      <TurnIcon type={p.icon} size={13} color={i === 0 ? '#4ade80' : 'rgba(255,255,255,0.5)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.4 }}>
                        {step.text}
                      </div>
                      {step.distance > 0 && (
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>
                          {step.distance < 1000 ? `${Math.round(step.distance)} m` : `${(step.distance / 1000).toFixed(1)} km`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar toggle tab ── */}
      <button
        onClick={() => setSideOpen(o => !o)}
        style={{
          position: 'absolute',
          right: sideOpen ? 300 : 0,
          top: '50%', transform: 'translateY(-50%)',
          zIndex: 1001,
          width: 22, height: 56,
          background: '#0f1923',
          border: 'none', cursor: 'pointer',
          borderRadius: '8px 0 0 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '-4px 0 14px rgba(0,0,0,0.3)',
          transition: 'right 0.35s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {sideOpen
          ? <ChevronRight size={14} color="rgba(255,255,255,0.6)" />
          : <ChevronRight size={14} color="rgba(255,255,255,0.6)" style={{ transform: 'rotate(180deg)' }} />
        }
      </button>

      {/* ── Map ── */}
      <div style={{ flex: 1, height: '100%', marginRight: sideOpen ? 300 : 0, transition: 'margin-right 0.35s cubic-bezier(.4,0,.2,1)' }}>
        <MapContainer
          center={SL_CENTER} zoom={8}
          maxBounds={SL_BOUNDS} maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasRoute && (
            <RoutingControl
              start={startPos} end={endPos}
              onRouteFound={setRouteInfo}
              onStepUpdate={setStepInfo}
            />
          )}
        </MapContainer>
      </div>

      {/* ── Pulse animation ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}