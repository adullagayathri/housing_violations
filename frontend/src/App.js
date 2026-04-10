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

  // IMPORTANT: NO DEFAULT SELECTION
  const [selectedViolation, setSelectedViolation] = useState(null);

  const [annotations, setAnnotations] = useState([]);
  const [imageSource, setImageSource] = useState("Upload Images");

  const [zoom, setZoom] = useState(1);

  // SINGLE SOURCE OF TRUTH FOR EXPORT
  const stageRef = useRef(null);

  const handleClearAll = () => {
    setImages({});
    setSelectedImage(null);
    setAnnotations([]);
  };

  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  // SAFE EXPORT FUNCTION
  const getCanvasBase64 = () => {
    try {
      if (!stageRef.current) return null;

      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 2,
      });

      if (!dataURL) return null;

      return dataURL.split(",")[1];
    } catch (err) {
      console.error("Export error:", err);
      return null;
    }
  };

  const handleSaveJSON = () => {
    if (!selectedImage) return;

    const annotatedImageBase64 = getCanvasBase64();

    if (!annotatedImageBase64) {
      alert("❌ No image to save!");
      return;
    }

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

      {/* HELP */}
      <div className="help-box">
        <h3>🧓 Simple Instructions</h3>
        <p>1. Select a violation type</p>
        <p>2. Select image</p>
        <p>3. Draw boxes on image</p>
        <p>4. Drag boxes to move them</p>
        <p>5. Use zoom buttons if needed</p>
        <p>6. Click undo if mistake</p>
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

      {/* ZOOM */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <button onClick={() => setZoom((z) => Math.min(z + 0.2, 5))}>
          🔍 Zoom In
        </button>
        <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.05))}>
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
              stageRef={stageRef}
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
