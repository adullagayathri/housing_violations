import React, { useState } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

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

function ImageCanvas({
  image,
  annotations,
  setAnnotations,
  selectedViolation,
  stageRef,
  scale,
}) {
  const [img] = useImage(image);
  const [newRect, setNewRect] = useState(null);
  const [isPanning, setIsPanning] = useState(false);

  // ✅ Adjust pointer for zoom
  const getScaledPointer = (stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    return {
      x: pointer.x / scale,
      y: pointer.y / scale,
    };
  };

  // 🖱️ Mouse Down
  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // 👉 If clicked empty canvas → PAN MODE
    if (e.target === stage) {
      if (scale > 1) setIsPanning(true);
      return;
    }

    // ❌ Must select violation
    if (!selectedViolation) return;

    const pos = getScaledPointer(stage);
    if (!pos) return;

    // ✏️ Start drawing
    setNewRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      violation: selectedViolation,
      color: VIOLATION_COLORS[selectedViolation] || "#e6194b",
    });
  };

  // 🖱️ Mouse Move
  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // 🖐️ PAN MODE
    if (isPanning && scale > 1) {
      const pos = stage.position();

      stage.position({
        x: pos.x + e.evt.movementX,
        y: pos.y + e.evt.movementY,
      });

      stage.batchDraw();
      return;
    }

    // ✏️ DRAW MODE
    if (!newRect) return;

    const pos = getScaledPointer(stage);
    if (!pos) return;

    setNewRect({
      ...newRect,
      width: pos.x - newRect.x,
      height: pos.y - newRect.y,
    });
  };

  // 🖱️ Mouse Up
  const handleMouseUp = () => {
    // Stop panning
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!newRect) return;

    // Save rectangle
    if (Math.abs(newRect.width) > 5 && Math.abs(newRect.height) > 5) {
      const finalizedRect = {
        ...newRect,
        width: Math.abs(newRect.width),
        height: Math.abs(newRect.height),
        x: newRect.width < 0 ? newRect.x + newRect.width : newRect.x,
        y: newRect.height < 0 ? newRect.y + newRect.height : newRect.y,
      };

      setAnnotations([...annotations, finalizedRect]);
    }

    setNewRect(null);
  };

  return (
    <Stage
      width={img ? img.width : 800}
      height={img ? img.height : 600}
      scaleX={scale}
      scaleY={scale}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      ref={stageRef}
      style={{
        border: "2px solid #F3D9BE",
        borderRadius: "8px",
        background: "#fff",
        cursor:
          scale > 1
            ? isPanning
              ? "grabbing"
              : "grab"
            : "crosshair",
      }}
    >
      <Layer>
        {img && <KonvaImage image={img} />}

        {/* Existing Annotations */}
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
              const newAnnotations = [...annotations];
              newAnnotations[i] = {
                ...newAnnotations[i],
                x: e.target.x(),
                y: e.target.y(),
              };
              setAnnotations(newAnnotations);
            }}
          />
        ))}

        {/* New Rectangle Preview */}
        {newRect && (
          <Rect
            x={newRect.width < 0 ? newRect.x + newRect.width : newRect.x}
            y={newRect.height < 0 ? newRect.y + newRect.height : newRect.y}
            width={Math.abs(newRect.width)}
            height={Math.abs(newRect.height)}
            fill={newRect.color + "33"}
            stroke={newRect.color}
            strokeWidth={2}
          />
        )}
      </Layer>
    </Stage>
  );
}

export default ImageCanvas;
