import React, { useEffect, useState, useRef } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import PolygonAnnotation from "./PolygonAnnotation";
import { flattenArray } from "./utils";

const AdaptiveImage = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scaledPolygons, setScaledPolygons] = useState([]);

  const [polygons, setPolygons] = useState([]); // Состояние для нескольких полигонов
  const [currentPoints, setCurrentPoints] = useState([]); // Точки текущего полигона
  const [isMouseOverPoint, setMouseOverPoint] = useState(false);
  const [isPolyComplete, setPolyComplete] = useState(false);
  const stageRef = useRef(null);

  const [image] = useImage(
    "https://carwow-uk-wp-3.imgix.net/18015-MC20BluInfinito-scaled-e1707920217641.jpg",
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'n' || e.key === 'N') {
        if (currentPoints.length >= 3) { // Проверка количество точек
          completePolygon();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPoints, polygons]);

  useEffect(() => {
    if (image) {
      const imgWidth = image.width;
      const imgHeight = image.height;
      const windowWidth = windowSize.width;
      const windowHeight = windowSize.height;

      const scale = Math.min(windowWidth / imgWidth, windowHeight / imgHeight);
      setScale(scale);

      setImageSize({ width: imgWidth, height: imgHeight });
    }
  }, [image, windowSize]);

  useEffect(() => {
    // Обновляем масштабированные полигоны
    const newScaledPolygons = polygons.map((points) =>
      points.map((point) => [
        point[0] * scale +
        (windowSize.width - imageSize.width * scale) / 2 +
        offset.x,

        point[1] * scale +
        (windowSize.height - imageSize.height * scale) / 2 +
        offset.y,
      ])
    );

    const flattenNewScaledPolygons = flattenArray(newScaledPolygons);

    setScaledPolygons(flattenNewScaledPolygons);
  }, [scale, offset, polygons, windowSize, imageSize]);


  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const completePolygon = () => {
    if (currentPoints.length >= 3) {
      setPolygons([...polygons, currentPoints]); // Добавляем текущий полигон в список
      setCurrentPoints([]); // Сбрасываем текущие точки
      setPolyComplete(false); // Разрешаем создание нового полигона
    }
  };

  const handlePointDragMove = (e) => {
    const index = e.target.index;
    const pos = [e.target.x(), e.target.y()];

    // Преобразуйте позицию точки с учетом масштаба и смещения
    const updatedPos = [
      (pos[0] - (windowSize.width - imageSize.width * scale) / 2 - offset.x) / scale,
      (pos[1] - (windowSize.height - imageSize.height * scale) / 2 - offset.y) / scale
    ];

    // Обновите состояние точек с новыми координатами
    setCurrentPoints([...currentPoints.slice(0, index), updatedPos, ...currentPoints.slice(index + 1)]);
  };

  const getMousePos = (stage) => {
    const position = stage.getPointerPosition();

    // Рассчитайте позицию мыши относительно изображения с учетом масштаба и смещения
    const scaledX =
      (position.x - offset.x - (windowSize.width - imageSize.width * scale) / 2) / scale;
    const scaledY =
      (position.y - offset.y - (windowSize.height - imageSize.height * scale) / 2) / scale;

    return [scaledX, scaledY];
  };

  const handleMouseDown = (e) => {
    if (isPolyComplete) return;
    const position = stageRef.current.getPointerPosition();

    const scaledX = (position.x - offset.x - (windowSize.width - imageSize.width * scale) / 2) / scale;
    const scaledY = (position.y - offset.y - (windowSize.height - imageSize.height * scale) / 2) / scale;

    if (isMouseOverPoint && currentPoints.length >= 3) {
      completePolygon();
      //setPolyComplete(true);
    } else {
      setCurrentPoints([...currentPoints, [scaledX, scaledY]]);
    }
  };

  const handleMouseMove = (e) => {
    if (isPolyComplete || currentPoints.length === 0) return;

    const stage = e.target.getStage();
    const mousePos = getMousePos(stage);

    const adjustPosition = (x, y) => [
      x * scale + (windowSize.width - imageSize.width * scale) / 2 + offset.x,
      y * scale + (windowSize.height - imageSize.height * scale) / 2 + offset.y
    ];

    const newPoints = [...currentPoints, mousePos];

    const tempLine = [
      ...newPoints.flatMap(point => adjustPosition(point[0], point[1])),
      adjustPosition(mousePos[0], mousePos[1]),
      adjustPosition(currentPoints[0][0], currentPoints[0][1])
    ];

    const flattenTempLine = flattenArray(tempLine);

    setScaledPolygons([
      ...polygons.map(polygon => polygon.flatMap(point => adjustPosition(point[0], point[1]))),
      flattenTempLine
    ]);
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

  return (
    <div>
      <button onClick={() => setScale((prevScale) => prevScale * 1.1)}>
        Increase Scale
      </button>
      <button onClick={() => setScale((prevScale) => prevScale / 1.1)}>
        Decrease Scale
      </button>

      <Stage
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        ref={stageRef}
        width={windowSize.width}
        height={windowSize.height}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={imageSize.width * scale}
              height={imageSize.height * scale}
              x={(windowSize.width - imageSize.width * scale) / 2 + offset.x}
              y={(windowSize.height - imageSize.height * scale) / 2 + offset.y}
            />
          )}

          {polygons.map((polygon, index) => (
            <PolygonAnnotation
              key={index}
              points={polygon}
              scaledPolygons={scaledPolygons[index]}
              handlePointDragMove={handlePointDragMove}
              handleGroupDragEnd={handleGroupDragEnd}
              handleMouseOverStartPoint={handleMouseOverStartPoint}
              handleMouseOutStartPoint={handleMouseOutStartPoint}
              isFinished={true}
              windowSize={windowSize}
              imageSize={imageSize}
              scale={scale}
            />
          ))}

          {currentPoints.length > 0 && (
            <PolygonAnnotation
              points={currentPoints}
              scaledPolygons={scaledPolygons[scaledPolygons.length - 1]} // Последний полигон
              handlePointDragMove={handlePointDragMove}
              handleGroupDragEnd={handleGroupDragEnd}
              handleMouseOverStartPoint={handleMouseOverStartPoint}
              handleMouseOutStartPoint={handleMouseOutStartPoint}
              isFinished={false}
              windowSize={windowSize}
              imageSize={imageSize}
              scale={scale}
            />
          )}

        </Layer>
      </Stage>
    </div>
  );
};

export default AdaptiveImage;
