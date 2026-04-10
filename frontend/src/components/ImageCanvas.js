import React, { useState } from "react";
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
  stageRef,
  scale,
}) {
  const [img] = useImage(image);
  const [newRect, setNewRect] = useState(null);

  // ✅ Adjust pointer for zoom
  const getScaledPointer = (stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    return {
      x: pointer.x / scale,
      y: pointer.y / scale,
    };
  };

  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // ❌ prevent drawing while dragging
    if (stage.isDragging()) return;

    const pos = getScaledPointer(stage);
    if (!pos) return;

    setNewRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      violation: selectedViolation,
      color: VIOLATION_COLORS[selectedViolation] || "#FF0000",
    });
  };

  const handleMouseMove = (e) => {
    if (!newRect) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = getScaledPointer(stage);
    if (!pos) return;

    setNewRect({
      ...newRect,
      width: pos.x - newRect.x,
      height: pos.y - newRect.y,
    });
  };

  const handleMouseUp = () => {
    if (!newRect) return;

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
      draggable={scale > 1}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragStart={(e) => {
        e.target.container().style.cursor = "grabbing";
      }}
      onDragEnd={(e) => {
        e.target.container().style.cursor = "grab";
      }}
      ref={stageRef}
      style={{
        border: "2px solid #F3D9BE",
        borderRadius: "8px",
        background: "#fff",
        cursor: scale > 1 ? "grab" : "crosshair",
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
