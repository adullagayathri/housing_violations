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
  const [zoom, setZoom] = useState(1);

  const stageRef = useRef(null);

  const getCanvasBase64 = () => {
    if (!stageRef.current) return null;
    return stageRef.current.toDataURL({ pixelRatio: 1 }).split(",")[1];
  };

  const handleSaveJSON = () => {
    if (!selectedImage) return;

    const annotatedImageBase64 = getCanvasBase64();
    if (!annotatedImageBase64) return alert("No image found");

    fetch("https://housing-violations.onrender.com/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_id: selectedImage,
        annotations,
        image_base64: annotatedImageBase64,
      }),
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          console.log("SERVER ERROR:", data);
          throw new Error(JSON.stringify(data));
        }

        return data;
      })
      .then((data) => {
        alert(`✅ Saved Successfully!\nRecord ID: ${data.recordId}`);
      })
      .catch((err) => {
        console.log("FULL ERROR:", err);
        alert("❌ Save Failed:\n" + err.message);
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
        <p>4. Drag to move</p>
        <p>5. Use zoom</p>
        <p style={{ color: "red" }}>⚠️ Always SAVE</p>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}>
          Zoom In
        </button>
        <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}>
          Zoom Out
        </button>
      </div>

      <UploadPanel
        images={images}
        setImages={setImages}
        setSelectedImage={setSelectedImage}
      />

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

      <SaveControls onSaveJSON={handleSaveJSON} />
      <AnnotationPreview annotations={annotations} />
    </div>
  );
}

export default App;
