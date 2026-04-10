import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

const VIOLATION_COLORS = {
  "Peeling Paint": "#FF0000",
  "Vehicles on Unpaved": "#00FF00",
  "Abandoned/Junk Vehicles": "#0000FF",
  "Overgrown Vegetation": "#FFA500",
  "Bad Roof": "#800080",
  "Broken Window": "#008080",
  "Broken Door": "#FFC0CB",
  "Rubbish / Garbage": "#808080",
  "Damaged Walk/Driveway": "#000000",
  "Damaged Siding / Soffit": "#00FFFF",
  "Damaged Foundation": "#800000",
  "Damaged Porch / Steps": "#008000",
  "Abandoned / Unsafe": "#800000",
};

function ImageCanvas({
  image,
  annotations,
  setAnnotations,
  selectedViolation,
  zoom,
}) {
  const [img] = useImage(image);
  const [newRect, setNewRect] = useState(null);
  const stageRef = useRef(null);

  // =========================
  // FIX POINTER POSITION
  // =========================
  const getPointerPos = (stage) => {
    const scale = stage.scaleX();
    const pos = stage.getPointerPosition();
    return {
      x: pos.x / scale,
      y: pos.y / scale,
    };
  };

  const handleMouseDown = (e) => {
    if (!selectedViolation) return;

    const stage = e.target.getStage();
    const { x, y } = getPointerPos(stage);

    setNewRect({
      x,
      y,
      width: 0,
      height: 0,
      violation: selectedViolation,
      color: VIOLATION_COLORS[selectedViolation] || "#FF0000",
    });
  };

  const handleMouseMove = (e) => {
    if (!newRect) return;

    const stage = e.target.getStage();
    const { x, y } = getPointerPos(stage);

    setNewRect({
      ...newRect,
      width: x - newRect.x,
      height: y - newRect.y,
    });
  };

  const handleMouseUp = () => {
    if (!newRect) return;

    const finalized = {
      ...newRect,
      width: Math.abs(newRect.width),
      height: Math.abs(newRect.height),
      x: newRect.width < 0 ? newRect.x + newRect.width : newRect.x,
      y: newRect.height < 0 ? newRect.y + newRect.height : newRect.y,
    };

    if (finalized.width > 5 && finalized.height > 5) {
      setAnnotations([...annotations, finalized]);
    }

    setNewRect(null);
  };

  return (
    <div className="canvas-wrapper">
      <Stage
        ref={stageRef}
        width={img ? img.width : 800}
        height={img ? img.height : 600}
        scaleX={zoom}
        scaleY={zoom}
        draggable={false}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          border: "2px solid #F3D9BE",
          borderRadius: "8px",
          background: "#fff",
          cursor: "crosshair",
          touchAction: "none",
        }}
      >
        <Layer>
          {img && <KonvaImage image={img} />}

          {annotations.map((ann, i) => (
            <Rect
              key={i}
              x={ann.x}
              y={ann.y}
              width={ann.width}
              height={ann.height}
              fill={ann.color + "33"}
              stroke={ann.color}
              strokeWidth={2}
              draggable
              onDragEnd={(e) => {
                const updated = [...annotations];
                updated[i] = {
                  ...updated[i],
                  x: e.target.x(),
                  y: e.target.y(),
                };
                setAnnotations(updated);
              }}
            />
          ))}

          {newRect && (
            <Rect
              x={newRect.x}
              y={newRect.y}
              width={Math.abs(newRect.width)}
              height={Math.abs(newRect.height)}
              fill={newRect.color + "33"}
              stroke={newRect.color}
              strokeWidth={2}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

export default ImageCanvas;
