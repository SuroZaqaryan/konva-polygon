import React from "react";
import { Line, Circle, Group } from "react-konva";

const PolygonAnnotation = (props) => {
  const {
    points,
    isFinished,
    scaledPolygons,
    polygons,
    setMouseOverPoint,
    isPolyComplete,
    setPolygons,
    offset,
    currentPoints,
    windowSize,
    imageSize,
    scale,
  } = props;
  const vertexRadius = 6;

  // Функция для ограничения перемещения точек
  const dragBoundFunc = (pos) => {
    const imageWidth = imageSize.width * scale;
    const imageHeight = imageSize.height * scale;
    const imageX = (windowSize.width - imageWidth) / 2 + offset.x;
    const imageY = (windowSize.height - imageHeight) / 2 + offset.y;

    let x = safeValue(pos.x);
    let y = safeValue(pos.y);

    return {
      x: Math.max(imageX, Math.min(imageWidth + imageX - vertexRadius, x)),
      y: Math.max(imageY, Math.min(imageHeight + imageY - vertexRadius, y)),
    };
  };

  const handlePointDragMove = (e) => {
    const index = e.target.index - 1;
    const currentPolygonIndex = e.target.parent.index - 1;

    const pos = [e.target.x(), e.target.y()];

    // Преобразуйте позицию точки с учетом масштаба и смещения
    const updatedPos = [
      (pos[0] - (windowSize.width - imageSize.width * scale) / 2 - offset.x) / scale,
      (pos[1] - (windowSize.height - imageSize.height * scale) / 2 - offset.y) / scale
    ];

    // Обновите состояние точек с новыми координатами
    const updatedPolygons = polygons.map((polygon, idx) => {
      if (idx === currentPolygonIndex) {
        return {
          ...polygon,
          polygons: polygon.polygons.map((point, pointIndex) => {
            return pointIndex === index ? updatedPos : point;
          })
        };
      }
      return polygon;
    });

    setPolygons(updatedPolygons);
  };

  const handleGroupDragEnd = (e) => {
    if (e.target.name() === "polygon") {
      const currentPolygonIndex = e.target.index - 1;
      const xOffset = e.target.x();
      const yOffset = e.target.y();

      const updatedPolygons = polygons.map((polygon, idx) => {
        if (idx === currentPolygonIndex) {
          return {
            ...polygon,
            polygons: polygon.polygons.map((point) => [
              point[0] + xOffset / scale,
              point[1] + yOffset / scale,
            ])
          };
        }
        return polygon;
      });

      setPolygons(updatedPolygons);
      e.target.position({ x: 0, y: 0 });
    }
  };

  const groupDragBound = (pos) => {
    const imageWidth = imageSize.width * scale;
    const imageHeight = imageSize.height * scale;

    // Calculate the current bounding box of the polygon
    const minX = Math.min(...points.map(p => p[0])) * scale + offset.x;
    const maxX = Math.max(...points.map(p => p[0])) * scale + offset.x;
    const minY = Math.min(...points.map(p => p[1])) * scale + offset.y;
    const maxY = Math.max(...points.map(p => p[1])) * scale + offset.y;

    // Calculate the constraints for dragging
    let x = pos.x;
    let y = pos.y;

    // Constrain x within the bounds of the image
    if (x + minX < 0) x = -minX;
    if (x + maxX > imageWidth) x = imageWidth - maxX;

    // Constrain y within the bounds of the image
    if (y + minY < 0) y = -minY;
    if (y + maxY > imageHeight) y = imageHeight - maxY;

    return { x, y };
  };

  const handleMouseOverStartPoint = (e) => {
    if (isPolyComplete || currentPoints.length < 3) return;
    e.target.scale({ x: 2, y: 2 });
    setMouseOverPoint(true);
  };

  const handleMouseOutStartPoint = (e) => {
    e.target.scale({ x: 1, y: 1 });
    setMouseOverPoint(false);
  };

  const handleGroupMouseOver = (e) => {
    if (!isFinished) return;
    e.target.getStage().container().style.cursor = "move";
  };

  const handleGroupMouseOut = (e) => {
    e.target.getStage().container().style.cursor = "default";
  };

  const safeValue = (value) => (isNaN(value) ? 0 : value);

  return (
    <Group
      name="polygon"
      draggable={isFinished}
      onDragEnd={handleGroupDragEnd}
      onMouseOut={handleGroupMouseOut}
      onMouseOver={handleGroupMouseOver}
      dragBoundFunc={groupDragBound}
    >
      <Line
        points={scaledPolygons}
        stroke="#000"
        strokeWidth={1}
        closed
        fill="#82828273"
        lineCap="round"
        lineJoin="round"
      />
      {points.map((point, index) => {
        const x = safeValue(point[0] * scale + (windowSize.width - imageSize.width * scale) / 2);
        const y = safeValue(point[1] * scale + (windowSize.height - imageSize.height * scale) / 2);

        const startPointAttr = index === 0
          ? {
            hitStrokeWidth: 8,
            onMouseOver: handleMouseOverStartPoint,
            onMouseOut: handleMouseOutStartPoint,
          }
          : null;

        return (
          <Circle
            key={index}
            x={x}
            y={y}
            radius={vertexRadius}
            fill="#dddddd"
            stroke="#000"
            strokeWidth={1}
            draggable
            onDragMove={handlePointDragMove}
            {...startPointAttr}
            dragBoundFunc={(pos) => dragBoundFunc(pos)}
          />
        );
      })}
    </Group>
  );
};

export default PolygonAnnotation;
