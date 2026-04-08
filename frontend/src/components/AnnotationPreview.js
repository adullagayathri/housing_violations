import React from "react";

function AnnotationPreview({ annotations, selectedImage }) {
  if (!annotations || annotations.length === 0) {
    return <div style={{ marginTop: "10px", fontStyle: "italic" }}>No violations added yet.</div>;
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Added Violations</h3>

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "15px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#F3D9BE" }}>
            <th style={{ border: "1px solid #ccc", padding: "6px" }}>Violation</th>
            <th style={{ border: "1px solid #ccc", padding: "6px" }}>BBox [x, y, w, h]</th>
            <th style={{ border: "1px solid #ccc", padding: "6px" }}>Color</th>
          </tr>
        </thead>
        <tbody>
          {annotations.map((ann, idx) => (
            <tr key={idx}>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>{ann.violation}</td>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                [{Math.round(ann.x)}, {Math.round(ann.y)}, {Math.round(ann.width)}, {Math.round(ann.height)}]
              </td>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    backgroundColor: ann.color,
                    borderRadius: "50%",
                  }}
                ></span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* JSON View */}
      <details style={{ backgroundColor: "#FFF3E6", padding: "10px", borderRadius: "8px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>View JSON Output</summary>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: "10px" }}>
          {JSON.stringify({ image_id: selectedImage, annotations: annotations }, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default AnnotationPreview;