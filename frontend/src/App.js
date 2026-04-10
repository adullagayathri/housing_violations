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
  const [selectedViolation, setSelectedViolation] = useState(""); // ✅ no default
  const [annotations, setAnnotations] = useState([]);
  const [imageSource, setImageSource] = useState("Upload Images");

  const [scale, setScale] = useState(1);

  const stageRef = useRef(null);

  // reset zoom when image changes
  useEffect(() => {
    setScale(1);
  }, [selectedImage]);

  const handleClearAll = () => {
    setImages({});
    setSelectedImage(null);
    setAnnotations([]);
  };

  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, prev.length - 1));
  };

  const getCanvasBase64 = () => {
    if (!stageRef.current) return null;
    return stageRef.current.toDataURL({ pixelRatio: 1 }).split(",")[1];
  };

  const handleSaveJSON = () => {
    if (!selectedImage) return;

    const annotatedImageBase64 = getCanvasBase64();
    if (!annotatedImageBase64) return alert("No image to save!");

    fetch("https://housing-violations.onrender.com/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_id: selectedImage,
        annotations: annotations.map((a) => ({
          violation: a.violation,
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
          color: a.color,
        })),
        image_base64: annotatedImageBase64,
      }),
    })
      .then((res) => res.json())
      .then(() => alert("✅ Saved to Salesforce!"))
      .catch((err) => alert("❌ Error saving: " + err));
  };

  return (
    <div className="App">
      <h1>🏠 House Issue Marking Tool</h1>

      {/* HELP BOX */}
      <div className="help-box">
        <b>How to use:</b><br />
        1. Upload images<br />
        2. Select image<br />
        3. Choose violation from left panel<br />
        4. Draw bounding box<br />
        5. Save results

        <div style={{
          marginTop: "10px",
          padding: "10px",
          background: "#fff3cd",
          border: "1px solid #ffeeba",
          borderRadius: "6px",
          fontWeight: "bold"
        }}>
          ⚠️ Don’t forget to SAVE before switching images!
        </div>
      </div>

      {/* UPLOAD */}
      <UploadPanel
        images={images}
        setImages={setImages}
        setSelectedImage={setSelectedImage}
      />

      {/* IMAGE SELECTOR */}
      {Object.keys(images).length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: "bold", fontSize: "16px" }}>
            Change Image Here:
          </label>

          <br />

          <select
            value={selectedImage}
            onChange={(e) => setSelectedImage(e.target.value)}
            style={{
              marginTop: "8px",
              padding: "10px",
              fontSize: "16px",
              width: "320px",
              borderRadius: "6px",
            }}
          >
            {Object.keys(images).map((img) => (
              <option key={img} value={img}>
                {img}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="main-content" style={{ display: "flex" }}>

        {/* LEFT SIDEBAR */}
        <div
          style={{
            width: "260px",
            borderRight: "1px solid #ddd",
            padding: "10px",
          }}
        >
          <h3>Violations</h3>

          {Object.keys(VIOLATION_COLORS).map((v) => (
            <div
              key={v}
              onClick={() => setSelectedViolation(v)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px",
                marginBottom: "6px",
                cursor: "pointer",
                borderRadius: "6px",
                border:
                  selectedViolation === v
                    ? "1px solid #999"
                    : "1px solid transparent",
                background: "transparent",
              }}
            >
              {/* color circle */}
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: VIOLATION_COLORS[v],
                  marginRight: "10px",
                }}
              />
              {v}
            </div>
          ))}
        </div>

        {/* RIGHT CANVAS */}
        <div className="canvas-panel" style={{ flex: 1, padding: "10px" }}>

          {/* ZOOM */}
          <div style={{ marginBottom: "10px" }}>
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
              stageRef={stageRef}
              scale={scale}
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
