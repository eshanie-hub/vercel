import React, { useEffect, useState } from "react";
import axios from "axios";

const heatmapStyles = `
.humidity-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: 80px repeat(24, 1fr);
  gap: 2px;
  flex: 1;
}

.heatmap-cell {
  width: 100%;
  height: 20px;
  border-radius: 3px;
}

.time-label {
  font-size: 10px;
  text-align: center;
  color: #64748b;
}

.date-label {
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
}

.legend {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 8px;
  font-size: 10px;
}

.legend-box {
  width: 12px;
  height: 12px;
  margin: 0 3px;
  border-radius: 2px;
}
`;

export default function HumidityReport() {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetchHumidity();
    }, []);

    const fetchHumidity = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/humidity");
            processData(res.data);
        } catch (err) {
            console.error("Error fetching humidity:", err);
        }
    };

    // 🔥 Convert backend logs → heatmap matrix
    const processData = (logs) => {
        const map = {};

        logs.forEach((log) => {
            const dateObj = new Date(log.createdAt);

            const date = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
            const hour = dateObj.getHours(); // 0–23

            if (!map[date]) map[date] = Array(24).fill(null);

            map[date][hour] = log.hum;
        });

        const formatted = Object.keys(map)
            .sort((a, b) => new Date(b) - new Date(a))
            .slice(0, 7) // last 7 days
            .map((date) => ({
                date,
                values: map[date],
            }));

        setData(formatted);
    };

    // 🎨 Color scale (Orange → Blue)
    const getColor = (value) => {
        if (value === null) return "#f1f5f9";

        // Normalize (0–100 assumed)
        const min = 0;
        const max = 100;
        const ratio = (value - min) / (max - min);

        const r = Math.floor(255 - ratio * 200); // orange → blue
        const g = Math.floor(160 - ratio * 100);
        const b = Math.floor(0 + ratio * 255);

        return `rgb(${r}, ${g}, ${b})`;
    };

    return (
        <>
            <style>{heatmapStyles}</style>

            <div className="humidity-container">
                <h2 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>
                    Humidity Heatmap
                </h2>

                {/* Time labels */}
                <div className="heatmap-grid">
                    <div></div>
                    {[...Array(24)].map((_, i) => (
                        <div key={i} className="time-label">
                            {i}
                        </div>
                    ))}

                    {/* Rows */}
                    {data.map((row, i) => (
                        <React.Fragment key={i}>
                            <div className="date-label">
                                {row.date.slice(5)} {/* MM-DD */}
                            </div>

                            {row.values.map((val, j) => (
                                <div
                                    key={j}
                                    className="heatmap-cell"
                                    style={{
                                        backgroundColor: getColor(val),
                                    }}
                                    title={`Hour: ${j}, Humidity: ${val ?? "N/A"}`}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </div>

                {/* Legend */}
                <div className="legend">
                    Low
                    <div
                        className="legend-box"
                        style={{ background: "rgb(255,160,0)" }}
                    ></div>
                    <div
                        className="legend-box"
                        style={{ background: "rgb(100,100,200)" }}
                    ></div>
                    High
                </div>
            </div>
        </>
    );
}