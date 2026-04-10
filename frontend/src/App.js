import React, { useState, useRef, useEffect } from "react";
import ImageCanvas from "./components/ImageCanvas";
import AnnotationPreview from "./components/AnnotationPreview";
import UploadPanel from "./components/UploadPanel";
import SaveControls from "./components/SaveControls";
import "./App.css";

const VIOLATION_COLORS = {
  "Peeling Paint": "#e6194b",
  "Vehicles on Unpaved": "#3cb44b",
  "Abandoned/Junk Vehicles": "#4363d8",
  "Overgrown Vegetation": "#f58231",
  "Bad Roof": "#911eb4",
  "Broken Window": "#46f0f0",
  "Broken Door": "#f032e6",
  "Rubbish / Garbage": "#bcf60c",
  "Damaged Walk/Driveway": "#fabebe",
  "Damaged Siding / Soffit": "#008080",
  "Damaged Foundation": "#e6beff",
  "Damaged Porch / Steps": "#9a6324",
  "Abandoned / Unsafe": "#fffac8",
};

function App() {
  const [images, setImages] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedViolation, setSelectedViolation] = useState("");
  const [annotations, setAnnotations] = useState([]);

  const [scale, setScale] = useState(1);
  const [moveMode, setMoveMode] = useState(false); // ✅ ONLY for pan

  const stageRef = useRef(null);

  useEffect(() => {
    setScale(1);
    setMoveMode(false);
    setSelectedViolation("");
  }, [selectedImage]);

  const handleClearAll = () => {
    setImages({});
    setSelectedImage(null);
    setAnnotations([]);
    setSelectedViolation("");
  };

  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const getCanvasBase64 = () => {
    if (!stageRef.current) return null;
    return stageRef.current.toDataURL({ pixelRatio: 1 }).split(",")[1];
  };

  const handleSaveJSON = () => {
    if (!selectedImage) return;

    const annotatedImageBase64 = getCanvasBase64();

    fetch("https://housing-violations.onrender.com/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_id: selectedImage,
        annotations,
        image_base64: annotatedImageBase64,
      }),
    })
      .then(() => alert("✅ Saved successfully!"))
      .catch((err) => alert("❌ Error: " + err));
  };

  return (
    <div className="App">
      <h1>🏠 House Issue Marking Tool</h1>

      <UploadPanel
        images={images}
        setImages={setImages}
        setSelectedImage={setSelectedImage}
      />

      {/* IMAGE SELECT */}
      {Object.keys(images).length > 0 && (
        <div style={{ marginBottom: "15px" }}>
          <label><b>Change Image:</b></label>
          <select
            value={selectedImage}
            onChange={(e) => setSelectedImage(e.target.value)}
            style={{ marginLeft: "10px", padding: "8px", width: "300px" }}
          >
            {Object.keys(images).map((img) => (
              <option key={img} value={img}>{img}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: "flex" }}>

        {/* SIDEBAR */}
        <div style={{ width: "260px", borderRight: "1px solid #ddd", padding: "10px" }}>
          <h3>Violations</h3>

          {Object.keys(VIOLATION_COLORS).map((v) => (
            <div
              key={v}
              onClick={() => {
                setSelectedViolation(v);
                setMoveMode(false); // switch to draw mode
              }}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: VIOLATION_COLORS[v],
                  marginRight: "10px",
                }}
              />
              {v}
            </div>
          ))}
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, padding: "10px" }}>

          {/* ZOOM + MOVE CONTROLS */}
          <div style={{ marginBottom: "10px" }}>

            <button
              onClick={() => setMoveMode((m) => !m)}
              style={{ marginRight: "10px" }}
            >
              🖐️ Move {moveMode ? "ON" : "OFF"}
            </button>

            <button onClick={() => setScale((s) => Math.min(s + 0.2, 5))}>
              🔍 Zoom In
            </button>

            <button
              onClick={() => setScale((s) => Math.max(s - 0.2, 0.2))}
              style={{ marginLeft: "10px" }}
            >
              🔎 Zoom Out
            </button>
          </div>

          {/* CANVAS */}
          {selectedImage && (
            <ImageCanvas
              image={images[selectedImage]}
              annotations={annotations}
              setAnnotations={setAnnotations}
              selectedViolation={selectedViolation}
              VIOLATION_COLORS={VIOLATION_COLORS}
              stageRef={stageRef}
              scale={scale}
              moveMode={moveMode}
            />
          )}

          <SaveControls
            onUndo={handleUndo}
            onSaveJSON={handleSaveJSON}
            onClearAll={handleClearAll}
          />

          {selectedImage && (
            <AnnotationPreview
              annotations={annotations}
              selectedImage={selectedImage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
