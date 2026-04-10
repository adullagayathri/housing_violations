import React, { useState, useRef } from "react";
import ViolationToolbar from "./components/ViolationToolbar";
import ImageCanvas from "./components/ImageCanvas";
import AnnotationPreview from "./components/AnnotationPreview";
import UploadPanel from "./components/UploadPanel";
import SaveControls from "./components/SaveControls";
import "./App.css";

function App() {
  const [images, setImages] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  // 🚨 IMPORTANT: no default selection
  const [selectedViolation, setSelectedViolation] = useState(null);

  const [annotations, setAnnotations] = useState([]);
  const [imageSource, setImageSource] = useState("Upload Images");

  const [zoom, setZoom] = useState(1);

  const stageRef = useRef(null);

  const handleClearAll = () => {
    setImages({});
    setSelectedImage(null);
    setAnnotations([]);
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
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        return data;
      })
      .then((data) => {
        alert(`✅ Saved successfully!\nRecord ID: ${data.recordId}`);
      })
      .catch((err) => {
        alert("❌ Error saving: " + err.message);
      });
  };

  return (
    <div className="App">
      <h1>🏠 House Issue Marking Tool</h1>

      {/* HELP BOX */}
      <div className="help-box">
        <h3>🧓 Easy Instructions</h3>

        <p>👉 First select a problem type (required)</p>
        <p>👉 Then draw on image</p>
        <p>👉 Drag boxes to move them</p>
        <p>👉 Scroll or buttons to zoom</p>
        <p>👉 Click UNDO if mistake</p>

        <p style={{ color: "red", fontWeight: "bold" }}>
          ⚠️ Always click SAVE after finishing
        </p>
      </div>

      {/* IMAGE SOURCE */}
      <div style={{ marginBottom: 20 }}>
        <label>
          <input
            type="radio"
            value="Upload Images"
            checked={imageSource === "Upload Images"}
            onChange={(e) => setImageSource(e.target.value)}
          />
          Upload Images
        </label>

        <label style={{ marginLeft: 20 }}>
          <input
            type="radio"
            value="Load From Folder"
            checked={imageSource === "Load From Folder"}
            onChange={(e) => setImageSource(e.target.value)}
          />
          Load From Folder
        </label>
      </div>

      {/* UPLOAD */}
      {imageSource && (
        <UploadPanel
          images={images}
          setImages={setImages}
          setSelectedImage={setSelectedImage}
        />
      )}

      {/* IMAGE SELECT */}
      {Object.keys(images).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label><b>Select Image:</b></label>
          <select
            value={selectedImage || ""}
            onChange={(e) => setSelectedImage(e.target.value)}
            style={{ marginLeft: 10 }}
          >
            {Object.keys(images).map((img) => (
              <option key={img} value={img}>
                {img}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ZOOM BUTTONS */}
      <div style={{ marginBottom: 10, display: "flex", gap: 10 }}>
        <button onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}>
          🔍 Zoom In
        </button>

        <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}>
          🔎 Zoom Out
        </button>
      </div>

      {/* MAIN */}
      <div className="main-content">
        <ViolationToolbar
          selectedViolation={selectedViolation}
          setSelectedViolation={setSelectedViolation}
        />

        <div className="canvas-panel">
          {selectedImage && (
            <ImageCanvas
              ref={stageRef}
              image={images[selectedImage]}
              annotations={annotations}
              setAnnotations={setAnnotations}
              selectedViolation={selectedViolation}
              zoom={zoom}
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
