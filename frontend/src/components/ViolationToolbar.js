import React from "react";

// Use the same color map as ImageCanvas
const VIOLATION_COLORS = {
  "Peeling Paint": "#FF0000",
  "Vehicles on Unpaved": "#00FF00",
  "Abandoned/Junk Vehicles": "#0000FF",
  "Overgrown Vegetation": "#FFA500",
  "Bad Roof": "#800080",
  "Broken Window": "#008080",
  "Broken Door": "#FFC0CB",
  "Rubbish / Garbage": "#808080",
  "Damaged Walk/Driveway": "#000000",
  "Damaged Siding / Soffit": "#00FFFF",
  "Damaged Foundation": "#800000",
  "Damaged Porch / Steps": "#008000",
  "Abandoned / Unsafe": "#800000",
};

function ViolationToolbar({ selectedViolation, setSelectedViolation }) {
  return (
    <div className="violation-toolbar">
      {Object.keys(VIOLATION_COLORS).map((violation) => (
        <button
          key={violation}
          onClick={() => setSelectedViolation(violation)}
          style={{
            backgroundColor: VIOLATION_COLORS[violation],
            color: "#fff",
            margin: "5px",
            padding: "6px 10px",
            border: selectedViolation === violation ? "3px solid #000" : "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {violation}
        </button>
      ))}
    </div>
  );
}

export default ViolationToolbar;