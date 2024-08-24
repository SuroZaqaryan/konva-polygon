import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Line, Circle, Group } from "react-konva";

const Polygon = (props) => {
  const {
    scale,
    offset,
    points,
    polygons,
    imageSize,
    windowSize,
    setPolygons,
    polygonLines,
    setMouseOverPoint,
    isPolygonComplete,
  } = props;

  const vertexRadius = 6;
  const safeValue = (value) => (isNaN(value) ? 0 : value);

  const updatedLines = (updatedPoints = points) => {
    return updatedPoints.map(point => [
      point[0] * scale +
      (windowSize.width - imageSize.width * scale) / 2 +
      offset.x,
      point[1] * scale +
      (windowSize.height - imageSize.height * scale) / 2 +
      offset.y,
    ]).flat();
  };

  useEffect(() => {
    const newPolygons = polygons.map((polygon) => {
      const newPoints = polygon.points.map((point) => [
        point[0] * scale +
        (windowSize.width - imageSize.width * scale) / 2 +
        offset.x,
        point[1] * scale +
        (windowSize.height - imageSize.height * scale) / 2 +
        offset.y,
      ]);

      return {
        ...polygon,
        lines: newPoints.flat(),
      };
    });

    setPolygons(newPolygons);
  }, [scale, offset, windowSize, imageSize, isPolygonComplete]);

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

    const updatedPos = [
      (pos[0] - (windowSize.width - imageSize.width * scale) / 2 - offset.x) / scale,
      (pos[1] - (windowSize.height - imageSize.height * scale) / 2 - offset.y) / scale
    ];

    const updatedPolygons = polygons.map((polygon, idx) => {
      if (idx === currentPolygonIndex) {
        const updatedPoints = polygon.points.map((point, pointIndex) => {
          return pointIndex === index ? updatedPos : point;
        })

        return {
          ...polygon,
          points: updatedPoints,
          lines: updatedLines(updatedPoints),
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
          const updatedPoints = polygon.points.map(point => [
            point[0] + xOffset / scale,
            point[1] + yOffset / scale,
          ]);

          return {
            ...polygon,
            points: updatedPoints,
            lines: updatedLines(updatedPoints),
          };
        }
        return polygon;
      });

      setPolygons(updatedPolygons);
      e.target.position({ x: 0, y: 0 });
    }
  };

  // Ограничение перемещение полигона за пределами KonvaImage
  const groupDragBound = (pos) => {
    const imageWidth = imageSize.width * scale;
    const imageHeight = imageSize.height * scale;

    // Позиция изображения на экране
    const imageX = (windowSize.width - imageWidth) / 2 + offset.x;
    const imageY = (windowSize.height - imageHeight) / 2 + offset.y;

    // Определение границ изображения
    const minImageX = imageX;
    const maxImageX = imageX + imageWidth;
    const minImageY = imageY;
    const maxImageY = imageY + imageHeight;

    // Определение текущих границ полигона
    const minPolygonX = Math.min(...points.map(p => p[0])) * scale + imageX;
    const maxPolygonX = Math.max(...points.map(p => p[0])) * scale + imageX;
    const minPolygonY = Math.min(...points.map(p => p[1])) * scale + imageY;
    const maxPolygonY = Math.max(...points.map(p => p[1])) * scale + imageY;

    // Корректировка позиции для ограничения перемещения
    let x = pos.x;
    let y = pos.y;

    if (x + minPolygonX < minImageX) {
      x = minImageX - minPolygonX;
    }
    if (x + maxPolygonX > maxImageX) {
      x = maxImageX - maxPolygonX;
    }

    if (y + minPolygonY < minImageY) {
      y = minImageY - minPolygonY;
    }
    if (y + maxPolygonY > maxImageY) {
      y = maxImageY - maxPolygonY;
    }

    return { x, y };
  };


  const handleMouseOverStartPoint = (e) => {
    if (!isPolygonComplete || points.length < 3) return;
    e.target.scale({ x: 2, y: 2 });
    setMouseOverPoint(true);
  };

  const handleMouseOutStartPoint = (e) => {
    e.target.scale({ x: 1, y: 1 });
    setMouseOverPoint(false);
  };

  const handleGroupMouseOver = (e) => {
    if (!isPolygonComplete) return;
    e.target.getStage().container().style.cursor = "move";
  };

  const handleGroupMouseOut = (e) => {
    e.target.getStage().container().style.cursor = "default";
  };

  return (
    <Group
      name="polygon"
      draggable={!isPolygonComplete}
      dragBoundFunc={groupDragBound}
      onDragEnd={handleGroupDragEnd}
      onMouseOut={handleGroupMouseOut}
      onMouseOver={handleGroupMouseOver}
    >
      <Line
        name='line'
        points={polygonLines}
        stroke="#000"
        strokeWidth={1}
        closed
        fill="#9f9f9f73"
        lineCap="round"
        lineJoin="round"
      />

      {points.map((point, index) => {
        const x = safeValue(point[0] * scale + (windowSize.width - imageSize.width * scale) / 2 + offset.x);
        const y = safeValue(point[1] * scale + (windowSize.height - imageSize.height * scale) / 2 + offset.y);


        const startPointAttr = index === 0
          ? {
            hitStrokeWidth: 8,
            onMouseOver: handleMouseOverStartPoint,
            onMouseOut: handleMouseOutStartPoint,
          }
          : null;

        return (
          <Circle
            name='circle'
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

Polygon.propTypes = {
  scale: PropTypes.number.isRequired,
  offset: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  points: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  polygons: PropTypes.arrayOf(PropTypes.shape({
    class: PropTypes.string,
    points: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  })).isRequired,
  imageSize: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  windowSize: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  setPolygons: PropTypes.func.isRequired,
  polygonLines: PropTypes.arrayOf(PropTypes.number).isRequired,
  setMouseOverPoint: PropTypes.func.isRequired,
  isPolygonComplete: PropTypes.bool.isRequired,
};

export default Polygon;