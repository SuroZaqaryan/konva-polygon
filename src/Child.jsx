import React, { useEffect, useState, useRef } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import PolygonAnnotation from "./PolygonAnnotation";

const AdaptiveImage = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [polygonLines, setPolygonLines] = useState([]);

  const [polygons, setPolygons] = useState([
    { class: 'Car', polygons: [[594, 378.75], [613.5, 287.25], [729, 387.75]] }
  ]);
  // Состояние для нескольких полигонов
  const [polygonCurrentPoints, setPolygonCurrentPoints] = useState([]); // Точки текущего полигона
  const [isMouseOverPoint, setMouseOverPoint] = useState(false);
  const [isPolygonComplete, setPolygonComplete] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const stageRef = useRef(null);

  const [image] = useImage(
    "https://carwow-uk-wp-3.imgix.net/18015-MC20BluInfinito-scaled-e1707920217641.jpg",
  );

  useEffect(() => {
    if (image) {
      const imgWidth = image.width;
      const imgHeight = image.height;
      const windowWidth = dimensions.width;
      const windowHeight = dimensions.height;

      const scale = Math.min(windowWidth / imgWidth, windowHeight / imgHeight);
      setScale(scale);

      setImageSize({ width: imgWidth, height: imgHeight });
    }
  }, [image, dimensions]);

  useEffect(() => {
    const newScaledPolygons = polygons.map(({ polygons }) =>
      polygons.map((point) => [
        point[0] * scale +
        (dimensions.width - imageSize.width * scale) / 2 +
        offset.x,
        point[1] * scale +
        (dimensions.height - imageSize.height * scale) / 2 +
        offset.y,
      ]).flat()
    );

    setPolygonLines(newScaledPolygons);
  }, [scale, offset, polygons, dimensions, imageSize]);


  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'n' || e.key === 'N') {
        if (polygonCurrentPoints.length >= 1) {
          const stage = stageRef.current;
          const mousePos = getMousePos(stage);

          const newPoint = mousePos;

          const completedPolygon = [
            ...polygonCurrentPoints,
            newPoint,
            polygonCurrentPoints[0] // Соединение с первой точкой
          ];

          setPolygons([...polygons, completedPolygon]);
          setPolygonCurrentPoints([]);
          setPolygonComplete(true);
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
  }, [polygonCurrentPoints, polygons, isPolygonComplete]);

  const completePolygon = () => {
    if (polygonCurrentPoints.length >= 3) {
      const newPolygon = {
        class: 'Car', // Или другой класс, если необходимо
        polygons: polygonCurrentPoints
      };
      setPolygons([...polygons, newPolygon]); // Добавляем новый полигон
      setPolygonCurrentPoints([]); // Сбрасываем текущие точки
      setPolygonComplete(false); // Разрешаем создание нового полигона
    }
  };


  const getMousePos = (stage) => {
    const position = stage.getPointerPosition();

    // Рассчитайте позицию мыши относительно изображения с учетом масштаба и смещения
    const scaledX =
      (position.x - offset.x - (dimensions.width - imageSize.width * scale) / 2) / scale;
    const scaledY =
      (position.y - offset.y - (dimensions.height - imageSize.height * scale) / 2) / scale;

    return [scaledX, scaledY];
  };

  const handleMouseDown = (e) => {
    if (isPolygonComplete || e.target.parent?.attrs.draggable) {
      setPolygonComplete(false);
      return;
    }

    const position = stageRef.current.getPointerPosition();
    const scaledX = (position.x - offset.x - (dimensions.width - imageSize.width * scale) / 2) / scale;
    const scaledY = (position.y - offset.y - (dimensions.height - imageSize.height * scale) / 2) / scale;

    // Функция проверки, находится ли точка внутри границ изображения
    const isPointInsideImage = (x, y) => {
      const imageWidth = imageSize.width * scale;
      const imageHeight = imageSize.height * scale;
      const imageX = (dimensions.width - imageWidth) / 2 + offset.x;
      const imageY = (dimensions.height - imageHeight) / 2 + offset.y;

      return (
        x >= imageX &&
        x <= imageX + imageWidth &&
        y >= imageY &&
        y <= imageY + imageHeight
      );
    };

    // Проверяем, находится ли точка внутри границ изображения
    const [adjustedX, adjustedY] = [
      scaledX * scale + (dimensions.width - imageSize.width * scale) / 2 + offset.x,
      scaledY * scale + (dimensions.height - imageSize.height * scale) / 2 + offset.y
    ];

    if (isPointInsideImage(adjustedX, adjustedY)) {
      if (isMouseOverPoint && polygonCurrentPoints.length >= 3) {
        completePolygon();
      } else {
        setPolygonCurrentPoints([...polygonCurrentPoints, [scaledX, scaledY]]);
      }
    }
  };

  const calculateDistance = (point1, point2) => {
    const scaleFactor = 1 / scale; // Учитываем текущий масштаб

    // Преобразуем координаты обратно в исходные пиксели экрана
    const x1 = (point1[0] - offset.x - (dimensions.width - imageSize.width * scale) / 2) / scaleFactor;
    const y1 = (point1[1] - offset.y - (dimensions.height - imageSize.height * scale) / 2) / scaleFactor;
    const x2 = (point2[0] - offset.x - (dimensions.width - imageSize.width * scale) / 2) / scaleFactor;
    const y2 = (point2[1] - offset.y - (dimensions.height - imageSize.height * scale) / 2) / scaleFactor;

    return Math.sqrt(
      (x2 - x1) ** 2 +
      (y2 - y1) ** 2
    );
  };

  const handleMouseMove = (e) => {
    if (isPolygonComplete || polygonCurrentPoints.length === 0) return;

    const stage = e.target.getStage();
    const mousePos = getMousePos(stage);

    const adjustPosition = (x, y) => [
      x * scale + (dimensions.width - imageSize.width * scale) / 2 + offset.x,
      y * scale + (dimensions.height - imageSize.height * scale) / 2 + offset.y
    ];

    if (isShiftPressed) {
      const lastPoint = polygonCurrentPoints[polygonCurrentPoints.length - 1];
      if (lastPoint) {
        const distance = calculateDistance(mousePos, lastPoint);

        if (distance >= 25) {
          const newPoints = [...polygonCurrentPoints, mousePos];
          setPolygonCurrentPoints(newPoints);

          const tempLine = [
            ...newPoints.flatMap(point => adjustPosition(point[0], point[1])),
            ...adjustPosition(mousePos[0], mousePos[1])
          ];

          setPolygonLines([
            ...polygons.map(polygon =>
              polygon.polygons.flatMap(point => adjustPosition(point[0], point[1]))
            ),
            tempLine
          ]);
        }
      }
    } else {
      const newPoints = [...polygonCurrentPoints, mousePos];

      const tempLine = [
        ...newPoints.flatMap(point => adjustPosition(point[0], point[1])),
        ...adjustPosition(mousePos[0], mousePos[1]),
        ...adjustPosition(polygonCurrentPoints[0][0], polygonCurrentPoints[0][1])
      ];

      setPolygonLines([
        ...polygons.map(polygon =>
          polygon.polygons.flatMap(point => adjustPosition(point[0], point[1]))
        ),
        tempLine
      ]);
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
      <button onClick={() => {
        console.log(polygons);

      }}>
        Show console
      </button>

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={imageSize.width * scale}
              height={imageSize.height * scale}
              x={(dimensions.width - imageSize.width * scale) / 2 + offset.x}
              y={(dimensions.height - imageSize.height * scale) / 2 + offset.y}
            />
          )}

          {polygons.map(({ polygons: polygon }, index) => {
            return (
              <PolygonAnnotation
                key={index}
                isFinished={true}
                points={polygon}
                scale={scale}
                offset={offset}
                polygons={polygons}
                imageSize={imageSize}
                dimensions={dimensions}
                polygonLines={polygonLines[index]}
                isPolygonComplete={isPolygonComplete}
                polygonCurrentPoints={polygonCurrentPoints}
                setPolygons={setPolygons}
                setMouseOverPoint={setMouseOverPoint}
              />
            );
          })}

          {polygonCurrentPoints.length > 0 && (
            <PolygonAnnotation
              isFinished={false}
              scale={scale}
              offset={offset}
              polygons={polygons}
              imageSize={imageSize}
              dimensions={dimensions}
              points={polygonCurrentPoints}
              isPolygonComplete={isPolygonComplete}
              polygonCurrentPoints={polygonCurrentPoints}
              polygonLines={polygonLines[polygonLines.length - 1]}
              setPolygons={setPolygons}
              setMouseOverPoint={setMouseOverPoint}
            />
          )}


        </Layer>
      </Stage>
    </div>
  );
};

export default AdaptiveImage;
