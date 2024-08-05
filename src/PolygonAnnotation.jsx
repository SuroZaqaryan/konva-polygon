import React, { useState, useEffect } from "react";
import { Line, Circle, Group } from "react-konva";

const dragBoundFunc = (stageWidth, stageHeight, vertexRadius, pos) => {
  let x = pos.x;
  let y = pos.y;
  if (pos.x + vertexRadius > stageWidth) x = stageWidth;
  if (pos.x - vertexRadius < 0) x = 0;
  if (pos.y + vertexRadius > stageHeight) y = stageHeight;
  if (pos.y - vertexRadius < 0) y = 0;
  return { x, y };
};
const minMax = (points) => {
  return points.reduce((acc, val) => {
    acc[0] = acc[0] === undefined || val < acc[0] ? val : acc[0];
    acc[1] = acc[1] === undefined || val > acc[1] ? val : acc[1];
    return acc;
  }, []);
};

const PolygonAnnotation = (props) => {
  const {
    points,
    setPoints,
    flattenedPoints,
    isFinished,
    handlePointDragMove,
    handleGroupDragEnd,
    handleMouseOverStartPoint,
    handleMouseOutStartPoint,
    windowSize,
    imageSize,
    scale,
    offset,
  } = props;
  const vertexRadius = 6;

  const [stage, setStage] = useState();
  const [minMaxX, setMinMaxX] = useState([0, 0]); //min and max in x axis
  const [minMaxY, setMinMaxY] = useState([0, 0]); //min and max in y axis

  const [scaledPolygons, setScaledPolygons] = useState([]);

  useEffect(() => {
    // Пересчитываем координаты полигонов при изменении масштаба или смещения
    const newScaledPolygons = points.map((point) => ({
      x:
        point[0] * scale +
        (windowSize.width - imageSize.width * scale) / 2 +
        offset.x,
      y:
        point[1] * scale +
        (windowSize.height - imageSize.height * scale) / 2 +
        offset.y,
    }));

    setScaledPolygons(newScaledPolygons);
  }, [scale, offset, points, windowSize, imageSize]);

  const handleGroupMouseOver = (e) => {
    if (!isFinished) return;
    e.target.getStage().container().style.cursor = "move";
    setStage(e.target.getStage());
  };

  const handleGroupMouseOut = (e) => {
    e.target.getStage().container().style.cursor = "default";
  };

  const handleGroupDragStart = (e) => {
    let arrX = points.map((p) => p[0]);
    let arrY = points.map((p) => p[1]);
    setMinMaxX(minMax(arrX));
    setMinMaxY(minMax(arrY));
  };

  const groupDragBound = (pos) => {
    let { x, y } = pos;
    const sw = stage.width();
    const sh = stage.height();
    if (minMaxY[0] + y < 0) y = -1 * minMaxY[0];
    if (minMaxX[0] + x < 0) x = -1 * minMaxX[0];
    if (minMaxY[1] + y > sh) y = sh - minMaxY[1];
    if (minMaxX[1] + x > sw) x = sw - minMaxX[1];
    return { x, y };
  };

  return (
    <Group
      name="polygon"
      draggable={isFinished}
      onDragStart={handleGroupDragStart}
      onDragEnd={handleGroupDragEnd}
      dragBoundFunc={groupDragBound}
      onMouseOver={handleGroupMouseOver}
      onMouseOut={handleGroupMouseOut}
    >
      <Line
        points={flattenedPoints}
        stroke="#00F1FF"
        strokeWidth={3}
        closed={isFinished}
        fill="rgb(140,30,255,0.5)"
      />
      {points.map((point, index) => {
        const x = point[0] - vertexRadius / 2;
        const y = point[1] - vertexRadius / 2;
        const startPointAttr =
          index === 0
            ? {
              hitStrokeWidth: 12,
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
            fill="#FF019A"
            stroke="#00F1FF"
            strokeWidth={2}
            draggable
            onDragMove={handlePointDragMove}
            dragBoundFunc={(pos) =>
              dragBoundFunc(stage.width(), stage.height(), vertexRadius, pos)
            }
            {...startPointAttr}
          />
        );
      })}
    </Group>
  );
};

export default PolygonAnnotation;
