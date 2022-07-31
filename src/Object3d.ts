import {
  configure as glConfigure,
  Matrix4,
  toRadians,
  Vector4,
} from '@math.gl/core';
import { G, Polygon as SvgPolygon, SVG } from '@svgdotjs/svg.js';

interface SvgPolygonHash {
  [key: string]: SvgPolygon;
}

export class Object3d {
  // SVG
  svgPolygon: SvgPolygonHash = {};
  group: G;
  clearSvg: boolean = true;

  // Math.gl
  fullTransform: Matrix4;
  perspectiveMatrix: Matrix4 | undefined;
  rotateX: Matrix4;

  // Geometries
  nodes: VectorHash;
  polygons: PolygonObj[];

  // Temp variables for Performance
  polygonTemp: sortingPolygons[] = [];
  tempVector: Vector4 = new Vector4();

  // Constants - Cube
  scaleCONSTANT = 70;
  rotationRadians = toRadians(2);
  //shape_params = { scale: 2 };

  // Constants - Utils
  TAU = Math.PI * 2;
  DEG_TO_RAD = Math.PI / 180;
  // utils - methods
  degToRad = (angle: number) => angle * this.DEG_TO_RAD;
  radToDeg = (angle: number) => angle * (180 / Math.PI);

  constructor() {
    this.fullTransform = this.getPerspectiveMatrix();
    this.rotateX = new Matrix4().rotateY(this.rotationRadians);

    glConfigure({ debug: false });

    const { points, polygons } = this.generateCube();
    this.nodes = points;
    this.polygons = polygons;
    this.setPolygonColors();

    const draw = SVG().addTo("body").size(300, 300);

    this.group = draw.group();
  }

  setPolygonColors() {
    for (let index = 0; index < this.polygons.length; index++) {
      const randomColor: string =
        "#" + Math.floor(Math.random() * 16777215).toString(16);
      this.polygons[index].color = randomColor;
    }
  }

  drawPolygon = (polygonTemp: sortingPolygons) => {
    if (!polygonTemp.color) throw new Error("No color found");
    if (this.clearSvg) {
      const newPolygon = this.group
        .polygon(polygonTemp.polygonPoints)
        .fill(polygonTemp.color);
      this.svgPolygon[polygonTemp.id] = newPolygon;
    } else {
      this.svgPolygon[polygonTemp.id].plot(polygonTemp.polygonPoints);
      this.group.add(this.svgPolygon[polygonTemp.id]);
    }
  };

  drawPolygonArray = () => {
    this.polygonTemp.forEach((polygon, index) => {
      this.drawPolygon(polygon);
    });
    this.group.center(150, 150);
  };

  rotatePolygon() {
    Object.keys(this.nodes).forEach((index) => {
      this.nodes[index] = this.nodes[index].transform(this.rotateX);
    });
  }

  render() {
    if (this.clearSvg) this.group.clear();
    this.rotatePolygon();

    this.sortPolygonArray();

    this.drawPolygonArray();
    this.polygonTemp = [];
  }

  renderAndUpdate = () => {
    if (this.clearSvg) this.group.clear();
    this.rotatePolygon();

    this.sortPolygonArray();

    this.drawPolygonArray();
    this.polygonTemp = [];
    this.clearSvg = false;
    requestAnimationFrame(this.renderAndUpdate);
  };

  sortAndScreen(unConvertedPolygons: PolygonObj[]) {
    // INFO: iterate over the polygons and get the scrren points and zIndex
    for (let index = 0; index < unConvertedPolygons.length; index++) {
      const newPolygon: NodeVector[] = [];

      this.polygons[index].points.forEach((poly: number) => {
        newPolygon.push(this.nodes[poly]);
      });

      const gtr: sortingPolygons = {
        ...this.getPolygonPoints(newPolygon),
        color: this.polygons[index].color,
        id: this.polygons[index].id,
      };
      this.polygonTemp.push(gtr);
    }
    return this.polygonTemp;
  }

  sortPolygonArray() {
    const polygonToSort: sortingPolygons[] = this.sortAndScreen(this.polygons);

    const polygonSorted: sortingPolygons[] = polygonToSort.sort((a, b) => {
      return b.zIndex - a.zIndex;
    });
    this.polygonTemp = polygonSorted;
  }

  generateCube(): Cube3d {
    let nodes: NodeHash = {
      "0": {
        x: -1,
        y: 1,
        z: -1,
      },
      "1": {
        x: 1,
        y: 1,
        z: -1,
      },
      "2": {
        x: 1,
        y: -1,
        z: -1,
      },
      "3": {
        x: -1,
        y: -1,
        z: -1,
      },
      "4": {
        x: -1,
        y: 1,
        z: 1,
      },
      "5": {
        x: 1,
        y: 1,
        z: 1,
      },
      "6": {
        x: 1,
        y: -1,
        z: 1,
      },
      "7": {
        x: -1,
        y: -1,
        z: 1,
      },
    };

    const nodesVector: VectorHash = this.convertToVect4(nodes);

    const polygons: PolygonObj[] = [
      { id: "0", points: [0, 1, 2, 3] },
      { id: "1", points: [1, 5, 6, 2] },
      { id: "2", points: [5, 4, 7, 6] },
      { id: "3", points: [4, 0, 3, 7] },
      { id: "4", points: [4, 5, 1, 0] },
      { id: "5", points: [3, 2, 6, 7] },
    ];

    return {
      points: nodesVector,
      polygons: polygons,
    };
  }

  convertToVect4(pointsHash: NodeHash): VectorHash {
    const converted: VectorHash = {};
    Object.keys(pointsHash).forEach(function (key) {
      const point = Object.values(pointsHash[key]);
      point.push(0);
      converted[key] = new Vector4(point);
    });

    return converted;
  }

  getScreenCoordinates(vector: Vector4 | number[]) {
    const transformV = this.fullTransform.transform(vector, this.tempVector);

    const [x, y, Z] = transformV;
    return [x, y, Z];
  }

  getPerspectiveMatrix() {
    const fovy = Math.PI * 0.5;
    this.perspectiveMatrix = new Matrix4();

    const perspective = this.perspectiveMatrix.perspective({
      fovy,
      aspect: 1,
      near: 0,
      far: 1,
    });

    const lookAt = perspective.lookAt({
      eye: [1, 1, 1],
      center: [0, 0, 0],
      up: [0, 1, 0],
    });

    const fullTransform = lookAt.scale(this.scaleCONSTANT);
    return fullTransform;
  }

  getPolygonPoints(vectorArray: Vector4[] | any[]) {
    let polygonPoints2: number[] = [];
    let zArray: number = 0;
    for (const vector of vectorArray) {
      const [pointX1, pointY1, PointZ] = this.getScreenCoordinates(vector);
      zArray += PointZ;
      polygonPoints2 = [...polygonPoints2, pointX1, pointY1];
    }

    return { polygonPoints: polygonPoints2, zIndex: zArray };
  }
}

interface NodeHash {
  [key: string]: NodeVector;
}

interface NodeVector {
  x: number;
  y: number;
  z: number;
  w?: number;
}

interface Cube3d {
  points: VectorHash;
  polygons: PolygonObj[];
}

interface VectorHash {
  [key: string]: Vector4;
}

interface PolygonObj {
  points: Array<number>;
  id: string;
  color?: string;
}

interface sortingPolygons {
  polygonPoints: number[];
  zIndex: number;
  color?: string;
  id: string;
}
