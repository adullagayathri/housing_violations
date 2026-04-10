import React, { useState, useEffect, forwardRef } from "react";
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
  { image, annotations, setAnnotations, selectedViolation },
  stageRef
) => {
  const [img] = useImage(image);

  const [newRect, setNewRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const W = 900;
  const H = 600;

  // 📌 FIT IMAGE INIT
  useEffect(() => {
    if (!img) return;

    const s = Math.min(W / img.width, H / img.height);

    setScale(s);
    setPosition({
      x: (W - img.width * s) / 2,
      y: (H - img.height * s) / 2,
    });
  }, [img]);

  // 🖱️ START DRAW
  const handleMouseDown = (e) => {
    setIsDrawing(true);

    const pos = e.target.getStage().getPointerPosition();

    setNewRect({
      x: (pos.x - position.x) / scale,
      y: (pos.y - position.y) / scale,
      width: 0,
      height: 0,
      violation: selectedViolation,
      color: VIOLATION_COLORS[selectedViolation],
    });
  };

  // 🖱️ DRAWING
  const handleMouseMove = (e) => {
    if (!isDrawing || !newRect) return;

    const pos = e.target.getStage().getPointerPosition();

    setNewRect({
      ...newRect,
      width: (pos.x - position.x) / scale - newRect.x,
      height: (pos.y - position.y) / scale - newRect.y,
    });
  };

  // 🖱️ STOP DRAW
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

  // 🔍 ZOOM
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };

    let newScale =
      e.evt.deltaY > 0 ? scale / scaleBy : scale * scaleBy;

    newScale = Math.max(0.5, Math.min(newScale, 6));

    setScale(newScale);

    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // 🖐️ PAN
  const handleDragEnd = (e) => {
    if (isDrawing) return;

    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <Stage
      ref={stageRef}
      width={W}
      height={H}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      draggable={!isDrawing}
      onDragEnd={handleDragEnd}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        border: "2px solid #ddd",
        borderRadius: "12px",
        background: "#fff",
        cursor: isDrawing ? "crosshair" : "grab",
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
            fill={ann.color + "30"}
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
            fill={newRect.color + "30"}
            stroke={newRect.color}
            strokeWidth={2}
          />
        )}
      </Layer>
    </Stage>
  );
});

export default ImageCanvas;
