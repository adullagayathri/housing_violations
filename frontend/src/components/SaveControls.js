import React from "react";

function SaveControls({ onSaveJSON, onClearAll, onUndo }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "16px",
        borderRadius: "14px",
        border: "2px solid #F3D9BE",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: "flex",
        gap: "10px",
        marginTop: "16px",
      }}
    >
      <button onClick={onUndo} style={{ flex: 1 }}>
        ↩️ Undo
      </button>
      <button onClick={onSaveJSON} style={{ flex: 1 }}>
        💾 Save JSON
      </button>
      <button onClick={onClearAll} style={{ flex: 1 }}>
        🗑️ Clear All
      </button>
    </div>
  );
}

export default SaveControls;