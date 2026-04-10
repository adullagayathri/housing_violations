import React, { useState } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

function ImageCanvas({
  image,
  annotations,
  setAnnotations,
  selectedViolation,
  VIOLATION_COLORS,
  stageRef,
  scale,
  moveMode,
}) {
  const [img] = useImage(image);
  const [newRect, setNewRect] = useState(null);

  const getPointer = (stage) => {
    const p = stage.getPointerPosition();
    return p ? { x: p.x / scale, y: p.y / scale } : null;
  };

  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // MOVE MODE = allow dragging only
    if (moveMode) return;

    if (!selectedViolation) return;

    const pos = getPointer(stage);
    if (!pos) return;

    setNewRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      violation: selectedViolation,
      color: VIOLATION_COLORS[selectedViolation],
    });
  };

  const handleMouseMove = (e) => {
    if (moveMode) return;

    const stage = e.target.getStage();
    if (!stage || !newRect) return;

    const pos = getPointer(stage);
    if (!pos) return;

    setNewRect({
      ...newRect,
      width: pos.x - newRect.x,
      height: pos.y - newRect.y,
    });
  };

  const handleMouseUp = () => {
    if (moveMode) return;
    if (!newRect) return;

    const rect = {
      ...newRect,
      width: Math.abs(newRect.width),
      height: Math.abs(newRect.height),
      x: newRect.width < 0 ? newRect.x + newRect.width : newRect.x,
      y: newRect.height < 0 ? newRect.y + newRect.height : newRect.y,
    };

    if (rect.width > 5 && rect.height > 5) {
      setAnnotations([...annotations, rect]);
    }

    setNewRect(null);
  };

  return (
    <Stage
      width={img ? img.width : 800}
      height={img ? img.height : 600}
      scaleX={scale}
      scaleY={scale}
      draggable={moveMode}   // ✅ ONLY MOVE MODE DRAGS
      ref={stageRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        border: "2px solid #ddd",
        background: "#fff",
        cursor: moveMode ? "grab" : "crosshair",
      }}
    >
      <Layer>
        {img && <KonvaImage image={img} />}

        {annotations.map((a, i) => (
          <Rect
            key={i}
            x={a.x}
            y={a.y}
            width={a.width}
            height={a.height}
            fill={(a.color || "#000") + "33"}
            stroke={a.color}
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
            x={
              newRect.width < 0
                ? newRect.x + newRect.width
                : newRect.x
            }
            y={
              newRect.height < 0
                ? newRect.y + newRect.height
                : newRect.y
            }
            width={Math.abs(newRect.width)}
            height={Math.abs(newRect.height)}
            fill="rgba(0,0,0,0.1)"
            stroke={newRect.color}
            strokeWidth={2}
          />
        )}
      </Layer>
    </Stage>
  );
}

export default ImageCanvas;
