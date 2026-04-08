import React, { useState } from "react";
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

  const handleClearAll = () => {
    setImages({});
    setSelectedImage(null);
    setAnnotations([]);
  };

  const handleSaveJSON = () => {
    if (!selectedImage) return;
    fetch("http://localhost:5000/save", {  // backend URL
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
      }),
    })
    .then(res => res.json())
    .then(data => alert("Saved to Salesforce!"))
    .catch(err => alert("Error saving to Salesforce: " + err));
  };
  // Undo last rectangle
  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, prev.length - 1));
  };

  return (
    <div className="App">
      <h1>🏠 House Issue Marking Tool</h1>
      <p>Upload house images, choose a violation, draw a box, and save all violations.</p>

      <div className="help-box">
        <b>How to use:</b><br />
        1. Upload images or load from folder<br />
        2. Choose an image<br />
        3. Choose a violation<br />
        4. Draw rectangles → auto added<br />
        5. Undo if needed<br />
        6. Click <b>Save JSON</b>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>
          <input
            type="radio"
            value="Upload Images"
            checked={imageSource === "Upload Images"}
            onChange={(e) => setImageSource(e.target.value)}
          />{" "}
          Upload Images
        </label>
        <label style={{ marginLeft: "20px" }}>
          <input
            type="radio"
            value="Load From Folder"
            checked={imageSource === "Load From Folder"}
            onChange={(e) => setImageSource(e.target.value)}
          />{" "}
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
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="image-select"><b>Choose Image:</b> </label>
          <select
            id="image-select"
            value={selectedImage}
            onChange={(e) => setSelectedImage(e.target.value)}
            style={{ padding: "6px", marginLeft: "10px" }}
          >
            {Object.keys(images).map((imgName) => (
              <option key={imgName} value={imgName}>{imgName}</option>
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