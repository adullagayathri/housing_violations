import React, { useState } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

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

  // Convert pointer based on zoom
  const getPointer = (stage) => {
    const p = stage.getPointerPosition();
    if (!p) return null;

    return {
      x: p.x / scale,
      y: p.y / scale,
    };
  };

  // ---------------- Mouse Down ----------------
  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // 🖐️ PAN MODE (only when clicking empty space)
    if (e.target.getClassName() === "Stage") {
      if (scale > 1) {
        setIsPanning(true);
      }
      return;
    }

    // ❌ must select violation
    if (!selectedViolation) return;

    const pos = getPointer(stage);
    if (!pos) return;

    setNewRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      violation: selectedViolation,
      color: "#e6194b", // default safe fallback (actual color handled in App)
    });
  };

  // ---------------- Mouse Move ----------------
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

    const pos = getPointer(stage);
    if (!pos) return;

    setNewRect({
      ...newRect,
      width: pos.x - newRect.x,
      height: pos.y - newRect.y,
    });
  };

  // ---------------- Mouse Up ----------------
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!newRect) return;

    const finalized = {
      ...newRect,
      width: Math.abs(newRect.width),
      height: Math.abs(newRect.height),
      x:
        newRect.width < 0
          ? newRect.x + newRect.width
          : newRect.x,
      y:
        newRect.height < 0
          ? newRect.y + newRect.height
          : newRect.y,
    };

    if (finalized.width > 5 && finalized.height > 5) {
      setAnnotations([...annotations, finalized]);
    }

    setNewRect(null);
  };

  return (
    <Stage
      width={img ? img.width : 800}
      height={img ? img.height : 600}
      scaleX={scale}
      scaleY={scale}
      ref={stageRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
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

        {/* Existing boxes */}
        {annotations.map((ann, i) => (
          <Rect
            key={i}
            x={ann.x}
            y={ann.y}
            width={ann.width}
            height={ann.height}
            fill={(ann.color || "#e6194b") + "33"}
            stroke={ann.color || "#e6194b"}
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

        {/* New drawing preview */}
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
            stroke="#e6194b"
            strokeWidth={2}
          />
        )}
      </Layer>
    </Stage>
  );
}

export default ImageCanvas;
