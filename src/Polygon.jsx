import React from "react";
import PropTypes from "prop-types";
import { Line, Circle, Group } from "react-konva";

const Polygon = (props) => {
  const {
    scale,
    offset,
    points,
    polygons,
    imageSize,
    isFinished,
    dimensions,
    setPolygons,
    polygonLines,
    setMouseOverPoint,
    isPolygonComplete,
    polygonCurrentPoints,
  } = props;
  
  const vertexRadius = 6;
  const safeValue = (value) => (isNaN(value) ? 0 : value);

  // Функция для ограничения перемещения точек
  const dragBoundFunc = (pos) => {
    const imageWidth = imageSize.width * scale;
    const imageHeight = imageSize.height * scale;
    const imageX = (dimensions.width - imageWidth) / 2 + offset.x;
    const imageY = (dimensions.height - imageHeight) / 2 + offset.y;

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
      (pos[0] - (dimensions.width - imageSize.width * scale) / 2 - offset.x) / scale,
      (pos[1] - (dimensions.height - imageSize.height * scale) / 2 - offset.y) / scale
    ];

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


  // Ограничение перемещение полигона за пределами KonvaImage
  const groupDragBound = (pos) => {
    const imageWidth = imageSize.width * scale;
    const imageHeight = imageSize.height * scale;

    const minX = Math.min(...points.map(p => p[0])) * scale + offset.x;
    const maxX = Math.max(...points.map(p => p[0])) * scale + offset.x;
    const minY = Math.min(...points.map(p => p[1])) * scale + offset.y;
    const maxY = Math.max(...points.map(p => p[1])) * scale + offset.y;

    let x = pos.x;
    let y = pos.y;

    if (x + minX < 0) x = -minX;
    if (x + maxX > imageWidth) x = imageWidth - maxX;

    if (y + minY < 0) y = -minY;
    if (y + maxY > imageHeight) y = imageHeight - maxY;

    return { x, y };
  };

  const handleMouseOverStartPoint = (e) => {
    if (isPolygonComplete || polygonCurrentPoints.length < 3) return;
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

  return (
    <Group
      name="polygon"
      draggable={isFinished}
      dragBoundFunc={groupDragBound}
      onDragEnd={handleGroupDragEnd}
      onMouseOut={handleGroupMouseOut}
      onMouseOver={handleGroupMouseOver}
    >
      <Line
        points={polygonLines}
        stroke="#000"
        strokeWidth={1}
        closed
        fill="#9f9f9f73"
        lineCap="round"
        lineJoin="round"
      />
      
      {points.map((point, index) => {
        const x = safeValue(point[0] * scale + (dimensions.width - imageSize.width * scale) / 2);
        const y = safeValue(point[1] * scale + (dimensions.height - imageSize.height * scale) / 2);

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

Polygon.propTypes = {
  scale: PropTypes.number.isRequired,
  offset: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  points: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  polygons: PropTypes.arrayOf(PropTypes.shape({
    class: PropTypes.string.isRequired,
    polygons: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  })).isRequired,
  imageSize: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  isFinished: PropTypes.bool.isRequired,
  dimensions: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  setPolygons: PropTypes.func.isRequired,
  polygonLines: PropTypes.arrayOf(PropTypes.number).isRequired,
  setMouseOverPoint: PropTypes.func.isRequired,
  isPolygonComplete: PropTypes.bool.isRequired,
  polygonCurrentPoints: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
};

export default Polygon;