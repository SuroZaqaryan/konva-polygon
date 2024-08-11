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

  const [polygons, setPolygons] = useState([
    [
      [594, 378.75],
      [613.5, 287.25],
      [729, 387.75]
    ]
  ]); // Состояние для нескольких полигонов
  const [currentPoints, setCurrentPoints] = useState([]); // Точки текущего полигона
  const [isMouseOverPoint, setMouseOverPoint] = useState(false);
  const [isPolyComplete, setPolyComplete] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const stageRef = useRef(null);

  const [image] = useImage(
    "https://carwow-uk-wp-3.imgix.net/18015-MC20BluInfinito-scaled-e1707920217641.jpg",
  );

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
      ]).flat()
    );

    setScaledPolygons(newScaledPolygons);
  }, [scale, offset, polygons, windowSize, imageSize]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'n' || e.key === 'N') {
        if (currentPoints.length >= 1) {
          const stage = stageRef.current;
          const mousePos = getMousePos(stage);

          const newPoint = mousePos;

          const completedPolygon = [
            ...currentPoints,
            newPoint,
            currentPoints[0] // Соединение с первой точкой
          ];

          setPolygons([...polygons, completedPolygon]);
          setCurrentPoints([]);
          setPolyComplete(true);
        }
      }

      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentPoints, polygons, isPolyComplete]);

  const completePolygon = () => {
    if (currentPoints.length >= 3) {
      setPolygons([...polygons, currentPoints]); // Добавляем текущий полигон в список
      setCurrentPoints([]); // Сбрасываем текущие точки
      setPolyComplete(false); // Разрешаем создание нового полигона
    }
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
    if (isPolyComplete || e.target.parent?.attrs.draggable) {
      setPolyComplete(false);
      return;
    }

    const position = stageRef.current.getPointerPosition();
    const scaledX = (position.x - offset.x - (windowSize.width - imageSize.width * scale) / 2) / scale;
    const scaledY = (position.y - offset.y - (windowSize.height - imageSize.height * scale) / 2) / scale;

    // Функция проверки, находится ли точка внутри границ изображения
    const isPointInsideImage = (x, y) => {
      const imageWidth = imageSize.width * scale;
      const imageHeight = imageSize.height * scale;
      const imageX = (windowSize.width - imageWidth) / 2 + offset.x;
      const imageY = (windowSize.height - imageHeight) / 2 + offset.y;

      return (
        x >= imageX &&
        x <= imageX + imageWidth &&
        y >= imageY &&
        y <= imageY + imageHeight
      );
    };

    // Проверяем, находится ли точка внутри границ изображения
    const [adjustedX, adjustedY] = [
      scaledX * scale + (windowSize.width - imageSize.width * scale) / 2 + offset.x,
      scaledY * scale + (windowSize.height - imageSize.height * scale) / 2 + offset.y
    ];

    if (isPointInsideImage(adjustedX, adjustedY)) {
      if (isMouseOverPoint && currentPoints.length >= 3) {
        completePolygon();
      } else {
        setCurrentPoints([...currentPoints, [scaledX, scaledY]]);
      }
    }
  };

  const calculateDistance = (point1, point2) => {
    return Math.sqrt(
      (point1[0] - point2[0]) ** 2 +
      (point1[1] - point2[1]) ** 2
    );
  };


  const handleMouseMove = (e) => {
    if (isPolyComplete || currentPoints.length === 0) return;

    const stage = e.target.getStage();
    const mousePos = getMousePos(stage);

    const adjustPosition = (x, y) => [
      parseFloat(x * scale + (windowSize.width - imageSize.width * scale) / 2 + offset.x),
      parseFloat(y * scale + (windowSize.height - imageSize.height * scale) / 2 + offset.y)
    ];

    const calculateDistance = (point1, point2) => Math.sqrt(
      (point1[0] - point2[0]) ** 2 +
      (point1[1] - point2[1]) ** 2
    );

    const updatePolygon = (points) => {
      const tempLine = [
        ...points.flatMap(point => adjustPosition(point[0], point[1])),
        ...adjustPosition(mousePos[0], mousePos[1])
      ];
      const validTempLine = tempLine.filter(value => typeof value === 'number');

      setScaledPolygons([
        ...polygons.map(polygon =>
          polygon.flatMap(point => adjustPosition(point[0], point[1]))
        ),
        validTempLine
      ]);
    };

    if (isShiftPressed) {
      const lastPoint = currentPoints[currentPoints.length - 1];
      const distance = lastPoint ? calculateDistance(mousePos, lastPoint) : 0;

      if (distance >= 25) {
        const newPoints = [...currentPoints, mousePos];
        setCurrentPoints(newPoints);
        updatePolygon(newPoints);
      }
    } else {
      const newPoints = [...currentPoints, mousePos];
      updatePolygon(newPoints);
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

          {polygons.map((polygon, index) => {
            return (
              <PolygonAnnotation
                key={index}
                points={polygon}
                currentPoints={currentPoints}
                setPolygons={setPolygons}
                scaledPolygons={scaledPolygons[index]}
                setMouseOverPoint={setMouseOverPoint}
                isPolyComplete={isPolyComplete}
                offset={offset}
                polygons={polygons}
                isFinished={true}
                windowSize={windowSize}
                imageSize={imageSize}
                scale={scale}
              />
            );
          })}

          {currentPoints.length > 0 && (
            <PolygonAnnotation
              points={currentPoints}
              currentPoints={currentPoints}
              scaledPolygons={scaledPolygons[scaledPolygons.length - 1]}
              setMouseOverPoint={setMouseOverPoint}
              isPolyComplete={isPolyComplete}
              offset={offset}
              polygons={polygons}
              setPolygons={setPolygons}
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
