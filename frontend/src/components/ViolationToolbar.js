import React from "react";

const VIOLATION_COLORS = {
  "Peeling Paint": "#FF0000",
  "Vehicles on Unpaved": "#00FF00",
  "Abandoned/Junk Vehicles": "#0000FF",
  "Overgrown Vegetation": "#FFA500",
  "Bad Roof": "#800080",
  "Broken Window": "#FFC0CB",
  "Broken Door": "#008080",
  "Rubbish / Garbage": "#808000",
  "Damaged Walk/Driveway": "#A52A2A",
  "Damaged Siding / Soffit": "#00FFFF",
  "Damaged Foundation": "#000000",
  "Damaged Porch / Steps": "#808080",
  "Abandoned / Unsafe": "#800000",
};

function ViolationToolbar({ selectedViolation, setSelectedViolation }) {
  return (
    <div className="violations-panel">
      {/* Selected Violation Card */}
      <div className="info-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <span
            className="legend-dot"
            style={{ backgroundColor: VIOLATION_COLORS[selectedViolation] }}
          ></span>
          <span>
            <b>{selectedViolation}</b>
          </span>
        </div>
        <div>This color will be used for the next box you draw.</div>
      </div>

      {/* Violation Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="violation-select">
          <b>Choose a Violation</b>
        </label>
        <select
          id="violation-select"
          value={selectedViolation}
          onChange={(e) => setSelectedViolation(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "6px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        >
          {Object.keys(VIOLATION_COLORS).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Violation Legend */}
      <div>
        <h4>All Violation Colors</h4>
        {Object.entries(VIOLATION_COLORS).map(([violation, color]) => (
          <div key={violation} className="legend-row">
            <span className="legend-dot" style={{ backgroundColor: color }}></span>
            <span>{violation}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ViolationToolbar;