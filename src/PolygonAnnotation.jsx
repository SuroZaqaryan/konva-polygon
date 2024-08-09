import React, { useState } from "react";
import { Line, Circle, Group } from "react-konva";

// Функция для ограничения перемещения точек
const dragBoundFunc = (stageWidth, stageHeight, vertexRadius, pos) => {
  let x = pos.x;
  let y = pos.y;
  if (pos.x + vertexRadius > stageWidth) x = stageWidth;
  if (pos.x - vertexRadius < 0) x = 0;
  if (pos.y + vertexRadius > stageHeight) y = stageHeight;
  if (pos.y - vertexRadius < 0) y = 0;
  return { x, y };
};


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
  const [stage, setStage] = useState();

  const handlePointDragMove = (e) => {
    const index = e.target.index - 1;
    const polygonIndex = e.target.parent.index - 1;

    const pos = [e.target.x(), e.target.y()];

    // Преобразуйте позицию точки с учетом масштаба и смещения
    const updatedPos = [
      (pos[0] - (windowSize.width - imageSize.width * scale) / 2 - offset.x) / scale,
      (pos[1] - (windowSize.height - imageSize.height * scale) / 2 - offset.y) / scale
    ];

    // Обновите состояние точек с новыми координатами
    const updatedPolygons = polygons.map((polygon, idx) => {
      if (idx === polygonIndex) {
        return polygon.map((point, pointIndex) => {
          return pointIndex === index ? updatedPos : point
        })
      }
      return polygon
    });


    setPolygons(updatedPolygons);
  };

  const handleGroupDragEnd = (e) => {
    if (e.target.name() === "polygon") {
      const xOffset = e.target.x();
      const yOffset = e.target.y();

      const updatedPolygons = polygons.map((polygon) =>
        polygon.map((point) => [
          point[0] + xOffset / scale,
          point[1] + yOffset / scale,
        ])
      );

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
    setStage(e.target.getStage());
  };

  const handleGroupMouseOut = (e) => {
    e.target.getStage().container().style.cursor = "default";
  };

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
        strokeWidth={2}
        closed
        fill="#82828273"
        lineCap="round"
        lineJoin="round"
      />
      {points.map((point, index) => {
        const x = point[0] * scale + (windowSize.width - imageSize.width * scale) / 2;
        const y = point[1] * scale + (windowSize.height - imageSize.height * scale) / 2;

        const startPointAttr =
          index === 0
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
            dragBoundFunc={(pos) => dragBoundFunc(stage.width(), stage.height(), vertexRadius, pos)}
          />
        );
      })}
    </Group>
  );
};

export default PolygonAnnotation;