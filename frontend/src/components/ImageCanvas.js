import React, { useState, useEffect, forwardRef } from "react";
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

const ImageCanvas = forwardRef(
({ image, annotations, setAnnotations, selectedViolation }, stageRef) => {
  const [img] = useImage(image);

  const [newRect, setNewRect] = useState(null);

  // zoom + pan
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const CANVAS_W = 900;
  const CANVAS_H = 600;

  // 🎯 FIT IMAGE ON LOAD (IMPORTANT)
  useEffect(() => {
    if (!img) return;

    const scale = Math.min(
      CANVAS_W / img.width,
      CANVAS_H / img.height
    );

    setScale(scale);

    setPosition({
      x: (CANVAS_W - img.width * scale) / 2,
      y: (CANVAS_H - img.height * scale) / 2,
    });
  }, [img]);

  // DRAW
  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    setNewRect({
      x: (pos.x - position.x) / scale,
      y: (pos.y - position.y) / scale,
      width: 0,
      height: 0,
      violation: selectedViolation,
      color: VIOLATION_COLORS[selectedViolation],
    });
  };

  const handleMouseMove = (e) => {
    if (!newRect) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    setNewRect({
      ...newRect,
      width: (pos.x - position.x) / scale - newRect.x,
      height: (pos.y - position.y) / scale - newRect.y,
    });
  };

  const handleMouseUp = () => {
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

  // ZOOM
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.08;

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };

    let newScale =
      e.evt.deltaY > 0 ? scale / scaleBy : scale * scaleBy;

    newScale = Math.max(0.5, Math.min(newScale, 5));

    setScale(newScale);

    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // PAN
  const handleDragEnd = (e) => {
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <Stage
      ref={stageRef}
      width={CANVAS_W}
      height={CANVAS_H}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      draggable
      onDragEnd={handleDragEnd}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        border: "2px solid #ddd",
        background: "#fff",
        borderRadius: "10px",
        cursor: "crosshair",
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
            fill={newRect.color + "33"}
            stroke={newRect.color}
          />
        )}
      </Layer>
    </Stage>
  );
});

export default ImageCanvas;
