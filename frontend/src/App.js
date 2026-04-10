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

  const [selectedViolation, setSelectedViolation] = useState(null);

  const [annotations, setAnnotations] = useState([]);
  const [imageSource, setImageSource] = useState("Upload Images");

  // ✅ your zoom buttons remain unchanged
  const [zoom, setZoom] = useState(1);

  const stageRef = useRef(null);

  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setImages({});
    setSelectedImage(null);
    setAnnotations([]);
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
        console.log(err);
        alert("❌ Save Error:\n" + err.message);
      });
  };

  return (
    <div className="App">
      <h1>🏠 House Issue Marking Tool</h1>

      <div className="help-box">
        <h3>🧓 Instructions</h3>
        <p>1. Select image</p>
        <p>2. Select violation first</p>
        <p>3. Draw boxes</p>
        <p>4. Drag to move boxes</p>
        <p>5. Use zoom buttons</p>
        <p style={{ color: "red", fontWeight: "bold" }}>
          ⚠️ Always click SAVE
        </p>
      </div>

      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}>
          🔍 Zoom In
        </button>
        <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}>
          🔎 Zoom Out
        </button>
      </div>

      <UploadPanel
        images={images}
        setImages={setImages}
        setSelectedImage={setSelectedImage}
      />

      {Object.keys(images).length > 0 && (
        <select
          value={selectedImage || ""}
          onChange={(e) => setSelectedImage(e.target.value)}
        >
          {Object.keys(images).map((img) => (
            <option key={img} value={img}>
              {img}
            </option>
          ))}
        </select>
      )}

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
            <AnnotationPreview annotations={annotations} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
