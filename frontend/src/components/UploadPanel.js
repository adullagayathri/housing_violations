import React, { useState } from "react";

function UploadPanel({ images, setImages, setSelectedImage }) {
  const [folderPath, setFolderPath] = useState("");

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = event.target.files;
    const newImages = { ...images };

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages[file.name] = e.target.result;
        setImages({ ...newImages });
        if (!folderPath) setSelectedImage(file.name);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle folder selection using webkitdirectory
  const handleFolderSelect = (event) => {
    const files = event.target.files;
    const newImages = { ...images };

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages[file.name] = e.target.result;
          setImages({ ...newImages });
          if (!folderPath) setSelectedImage(file.name);
        };
        reader.readAsDataURL(file);
      }
    });

    if (files.length > 0) {
      setFolderPath(files[0].webkitRelativePath.split("/")[0]); // just first folder name
    }
  };

  const uploadedCount = Object.keys(images).length;

  return (
    <div style={{
      background: "#fff",
      padding: "16px",
      borderRadius: "14px",
      border: "2px solid #F3D9BE",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      marginBottom: "20px"
    }}>
      <h3>Upload Images</h3>
      
      <div style={{ marginBottom: "10px" }}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="folder-upload">
          <button>📂 Load From Folder</button>
        </label>
        <input
          id="folder-upload"
          type="file"
          webkitdirectory="true"
          directory=""
          multiple
          style={{ display: "none" }}
          onChange={handleFolderSelect}
        />
      </div>

      {uploadedCount > 0 && (
        <div>
          ✅ Uploaded {uploadedCount} image{uploadedCount > 1 ? "s" : ""} {folderPath && `(from folder: ${folderPath})`}
        </div>
      )}
    </div>
  );
}

export default UploadPanel;