import React, { useRef, useState } from "react";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

function ImageCanvas({ image, annotations, setAnnotations, selectedViolation }) {
  const [img] = useImage(image);
  const [newRect, setNewRect] = useState(null);
  const stageRef = useRef();

  // Unified violation colors mapping
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
    "Abandoned / Unsafe": "#FFFF00",
  };

  const getColor = (violation) => VIOLATION_COLORS[violation] || "#FF0000";

  // Start drawing
  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    setNewRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      violation: selectedViolation,
      color: getColor(selectedViolation),
    });
  };

  // Resize while dragging
  const handleMouseMove = (e) => {
    if (!newRect) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    setNewRect({
      ...newRect,
      width: pos.x - newRect.x,
      height: pos.y - newRect.y,
    });
  };

  // Finish drawing → auto add to annotations
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      ref={stageRef}
      style={{
        border: "2px solid #F3D9BE",
        borderRadius: "8px",
        background: "#fff",
        cursor: "crosshair",
      }}
    >
      <Layer>
        {img && <KonvaImage image={img} />}

        {/* Existing annotations */}
        {annotations.map((ann, i) => (
          <Rect
            key={i}
            x={ann.x}
            y={ann.y}
            width={ann.width}
            height={ann.height}
            fill={getColor(ann.violation) + "33"} // always sync color
            stroke={getColor(ann.violation)}
            strokeWidth={2}
            draggable
            onDragEnd={(e) => {
              const newAnnotations = [...annotations];
              newAnnotations[i] = { ...newAnnotations[i], x: e.target.x(), y: e.target.y() };
              setAnnotations(newAnnotations);
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const newAnnotations = [...annotations];
              newAnnotations[i] = {
                ...newAnnotations[i],
                x: node.x(),
                y: node.y(),
                width: node.width() * node.scaleX(),
                height: node.height() * node.scaleY(),
              };
              node.scaleX(1);
              node.scaleY(1);
              setAnnotations(newAnnotations);
            }}
          />
        ))}

        {/* Rectangle while drawing */}
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