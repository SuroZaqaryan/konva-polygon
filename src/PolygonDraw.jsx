import React, { useEffect, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Stage } from "react-konva";
import useImage from "use-image";
import Polygon from "./Polygon";

const maxZoom = 5; // Ограничение увеличения масштаба
const minZoom = 0.3; // Ограничение уменьшения масштаба

const PolygonDraw = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const [polygons, setPolygons] = useState([
    { class: 'Car', points: [[594, 378.75], [613.5, 287.25], [729, 387.75]], lines: [] }
  ]);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isMouseOverPoint, setMouseOverPoint] = useState(false);
  const [isPolygonComplete, setPolygonComplete] = useState(false);

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
        if (polygons.length > 0 && polygons[polygons.length - 1].points.length >= 1) {
          const stage = stageRef.current;
          const newPoint = getMousePos(stage);

          const completedPolygon = [
            ...polygons[polygons.length - 1].points,
            newPoint,
            polygons[polygons.length - 1].points[0] // Соединение с первой точкой
          ];

          const newPolygon = {
            class: 'Car',
            points: completedPolygon
          };

          setPolygons(prev => [
            ...prev.slice(0, -1), // Убираем последний незавершенный полигон
            newPolygon
          ]);
          
          setPolygonComplete(false); // Завершаем текущий полигон
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
  }, [polygons, isPolygonComplete]);

  const getMousePos = (stage) => {
    const position = stage.getPointerPosition();

    // Расчет позицию мыши относительно изображения с учетом масштаба и смещения
    const scaledX =
      (position.x - offset.x - (windowSize.width - imageSize.width * scale) / 2) / scale;
    const scaledY =
      (position.y - offset.y - (windowSize.height - imageSize.height * scale) / 2) / scale;

    return [scaledX, scaledY];
  };

  const handleMouseDown = (e) => {
    if (e.target.attrs.name === 'circle' || e.target.attrs.name === 'line') {
      return setPolygonComplete(false);
    } else {
      setPolygonComplete(true);
    }


    if (!isPolygonComplete) {
      if (e.evt.button !== 0 || e.target.parent?.attrs.draggable) return
    }

    const position = stageRef.current.getPointerPosition();

    const scaledX = (position.x - offset.x - (windowSize.width - imageSize.width * scale) / 2) / scale;
    const scaledY = (position.y - offset.y - (windowSize.height - imageSize.height * scale) / 2) / scale;

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

    const [adjustedX, adjustedY] = [
      scaledX * scale + (windowSize.width - imageSize.width * scale) / 2 + offset.x,
      scaledY * scale + (windowSize.height - imageSize.height * scale) / 2 + offset.y
    ];

    if (isPointInsideImage(adjustedX, adjustedY)) {
      if (isMouseOverPoint && polygons.length >= 1) {
        setPolygonComplete(false);
      } else {
        setPolygons(prev => {
          if (prev.length > 0 && isPolygonComplete) {
            // Добавляем точку к последнему полигону
            return prev.map((polygon, index) =>
              index === prev.length - 1
                ? { ...polygon, points: [...polygon.points, [scaledX, scaledY]] }
                : polygon
            );
          }
          // Создаем новый полигон, если предыдущих нет
          return [...prev, { points: [[scaledX, scaledY]] }];
        });

      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isPolygonComplete) return;

    const stage = e.target.getStage();
    const mousePos = getMousePos(stage);

    const adjustPosition = (x, y) => [
      x * scale + (windowSize.width - imageSize.width * scale) / 2 + offset.x,
      y * scale + (windowSize.height - imageSize.height * scale) / 2 + offset.y
    ];

    if (isShiftPressed) {
      // Получаем точки последнего активного полигона
      const lastPolygonIndex = polygons.length - 1;
      const lastPolygonPoints = polygons[lastPolygonIndex]?.points || [];

      const lastPoint = lastPolygonPoints[lastPolygonPoints.length - 1];
      const distance = calculateDistance(mousePos, lastPoint);

      if (lastPoint && distance >= 25) {
        const newPoints = [...lastPolygonPoints, mousePos];

        const tempLine = [
          ...newPoints.flatMap(point => adjustPosition(point[0], point[1])),
          ...adjustPosition(mousePos[0], mousePos[1])
        ];

        setPolygons(prev => [
          ...prev.slice(0, lastPolygonIndex),
          {
            ...prev[lastPolygonIndex],
            points: newPoints,
            lines: tempLine
          }
        ]);
      }
    }
    else {
      const lastPoint = polygons[polygons.length - 1].points;
      const newPoints = [...lastPoint, mousePos];

      const tempLine = [
        ...newPoints.flatMap(point => adjustPosition(point[0], point[1])),
        ...adjustPosition(mousePos[0], mousePos[1]),
        ...adjustPosition(lastPoint[0][0], lastPoint[0][1])
      ];

      // Распределение все предыдущие полигоны, кроме последнего
      setPolygons(prev => [
        ...prev.slice(0, -1),
        { ...prev[prev.length - 1], lines: tempLine }
      ]);

    }
  };

  const calculateDistance = (point1, point2) => {
    const scaleFactor = 1 / scale; // Текущий масштаб

    const x1 = (point1[0] - offset.x - (windowSize.width - imageSize.width * scale) / 2) / scaleFactor;
    const y1 = (point1[1] - offset.y - (windowSize.height - imageSize.height * scale) / 2) / scaleFactor;
    const x2 = (point2[0] - offset.x - (windowSize.width - imageSize.width * scale) / 2) / scaleFactor;
    const y2 = (point2[1] - offset.y - (windowSize.height - imageSize.height * scale) / 2) / scaleFactor;

    return Math.sqrt(
      (x2 - x1) ** 2 +
      (y2 - y1) ** 2
    );
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = scale;
    const pointerPosition = stage.getPointerPosition();

    const imagePosition = {
      x: (windowSize.width - imageSize.width * oldScale) / 2 + offset.x,
      y: (windowSize.height - imageSize.height * oldScale) / 2 + offset.y,
    };

    const pointerRelativeToImage = {
      x: (pointerPosition.x - imagePosition.x) / oldScale,
      y: (pointerPosition.y - imagePosition.y) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    if (newScale <= maxZoom && newScale >= minZoom) {
      setScale(newScale);

      setOffset({
        x: pointerPosition.x - pointerRelativeToImage.x * newScale - (windowSize.width - imageSize.width * newScale) / 2,
        y: pointerPosition.y - pointerRelativeToImage.y * newScale - (windowSize.height - imageSize.height * newScale) / 2,
      });
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
      <button onClick={() => console.log(polygons)}>
        Show console
      </button>

      <Stage
        ref={stageRef}
        onWheel={handleWheel}
        width={windowSize.width}
        height={windowSize.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
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
              <Polygon
                key={index}
                scale={scale}
                offset={offset}
                polygons={polygons}
                imageSize={imageSize}
                windowSize={windowSize}
                points={polygon.points}
                polygonLines={polygon.lines || []}
                isPolygonComplete={isPolygonComplete}
                setPolygons={setPolygons}
                setMouseOverPoint={setMouseOverPoint}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default PolygonDraw;
