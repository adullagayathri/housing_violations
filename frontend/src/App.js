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
  const [selectedViolation, setSelectedViolation] = useState("Peeling Paint");
  const [annotations, setAnnotations] = useState([]);
  const [imageSource, setImageSource] = useState("Upload Images");

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
        alert(`✅ Saved successfully!\nRecord ID: ${data.sfId}`);
      })
      .catch((err) => {
        alert("❌ Error saving: " + err.message);
      });
  };

  return (
    <div className="App">
      <h1>🏠 House Issue Marking Tool</h1>

      <div className="help-box">
        <h3>🧾 How to Use This Tool</h3>

        <p>1. Select image</p>
        <p>2. Zoom with mouse wheel 🔍</p>
        <p>3. Drag to draw boxes</p>

        <br />
        <b>✏️ Box Controls:</b>
        <p>• Drag = move box</p>
        <p>• Resize = edges</p>
        <p>• Draw again = add more</p>

        <br />
        <b>↩️ Mistakes:</b>
        <p>• Undo removes last box</p>

        <br />
        <b style={{ color: "red" }}>
          ⚠️ Always click SAVE after finishing
        </b>
      </div>

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

      {imageSource && (
        <UploadPanel
          images={images}
          setImages={setImages}
          setSelectedImage={setSelectedImage}
        />
      )}

      {Object.keys(images).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label><b>Select Image:</b></label>
          <select
            value={selectedImage}
            onChange={(e) => setSelectedImage(e.target.value)}
            style={{ marginLeft: 10 }}
          >
            {Object.keys(images).map((img) => (
              <option key={img} value={img}>{img}</option>
            ))}
          </select>
        </div>
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
