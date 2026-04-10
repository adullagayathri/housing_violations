import React, { useState, forwardRef } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

const VIOLATION_COLORS = {
  "Peeling Paint": "#FF4B4B",
  "Vehicles on Unpaved": "#2ECC71",
  "Abandoned/Junk Vehicles": "#3498DB",
  "Overgrown Vegetation": "#F39C12",
  "Bad Roof": "#9B59B6",
  "Broken Window": "#1ABC9C",
  "Broken Door": "#E67E22",
  "Rubbish / Garbage": "#7F8C8D",
  "Damaged Walk/Driveway": "#34495E",
  "Damaged Siding / Soffit": "#00BCD4",
  "Damaged Foundation": "#8E44AD",
  "Damaged Porch / Steps": "#27AE60",
  "Abandoned / Unsafe": "#C0392B",
};

const ImageCanvas = forwardRef(
(
  { image, annotations, setAnnotations, selectedViolation, zoom },
  stageRef
) => {
  const [img] = useImage(image);

  const [newRect, setNewRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMouseDown = (e) => {
    if (!selectedViolation) return;

    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();

    setNewRect({
      x: pos.x / zoom,
      y: pos.y / zoom,
      width: 0,
      height: 0,
      violation: selectedViolation,
      color: VIOLATION_COLORS[selectedViolation],
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !newRect) return;

    const pos = e.target.getStage().getPointerPosition();

    setNewRect({
      ...newRect,
      width: pos.x / zoom - newRect.x,
      height: pos.y / zoom - newRect.y,
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);

    if (!newRect) return;

    const rect = {
      ...newRect,
      x: Math.min(newRect.x, newRect.x + newRect.width),
      y: Math.min(newRect.y, newRect.y + newRect.height),
      width: Math.abs(newRect.width),
      height: Math.abs(newRect.height),
    };

    if (rect.width > 5 && rect.height > 5) {
      setAnnotations([...annotations, rect]);
    }

    setNewRect(null);
  };

  return (
    <Stage
      ref={stageRef}
      width={900}
      height={600}
      scaleX={zoom}
      scaleY={zoom}
      draggable={!isDrawing}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        border: "2px solid #eee",
        borderRadius: "12px",
        background: "#fff",
        cursor: selectedViolation ? "crosshair" : "not-allowed",
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
            fill={ann.color + "40"}
            stroke={ann.color}
            strokeWidth={2}
            draggable
            onDragEnd={(e) => {
              const copy = [...annotations];
              copy[i].x = e.target.x();
              copy[i].y = e.target.y();
              setAnnotations(copy);
            }}
          />
        ))}

        {newRect && (
          <Rect
            x={newRect.x}
            y={newRect.y}
            width={newRect.width}
            height={newRect.height}
            fill={newRect.color + "40"}
            stroke={newRect.color}
            strokeWidth={2}
          />
        )}
      </Layer>
    </Stage>
  );
});

export default ImageCanvas;
