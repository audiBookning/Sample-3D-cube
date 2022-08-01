import {
  configure as glConfigure,
  Matrix4,
  NumericArray,
  toRadians,
  Vector4,
} from '@math.gl/core';
import {
  G,
  PointArrayAlias,
  Polygon as SvgPolygon,
  SVG,
} from '@svgdotjs/svg.js';

import {
  Cube3d,
  DisplayPolygonsRefNodes,
  NodeHash,
  NodeVector,
  PolygonObj,
  PolygonsRefNodes,
  VectorHash,
} from './types';

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
  polygons: PolygonsRefNodes[];

  // Temp variables for Performance
  polygonTemp: DisplayPolygonsRefNodes[] = [];
  tempVector: Vector4 = new Vector4();

  // Constants - Cube
  scaleCONSTANT = 40;
  rotationRadians = toRadians(2);
  //shape_params = { scale: 2 };

  // Constants - Utils
  TAU = Math.PI * 2;
  DEG_TO_RAD = Math.PI / 180;
  // utils - methods
  degToRad = (angle: number) => angle * this.DEG_TO_RAD;
  radToDeg = (angle: number) => angle * (180 / Math.PI);
  draw: import("@svgdotjs/svg.js").Svg;
  stretch: Matrix4;

  constructor(scale: number[] = [1, 1, 1]) {
    this.stretch = new Matrix4().scale(scale);

    this.fullTransform = this.getPerspectiveMatrix();
    this.rotateX = new Matrix4().rotateY(this.rotationRadians);

    glConfigure({ debug: false });

    const { points, polygons } = this.generateCube();
    this.nodes = points;
    this.stretchPolygon();
    this.polygons = polygons;
    this.setPolygonColors();

    this.draw = SVG();
    this.draw.addTo("body").size(300, 300);

    this.group = this.draw.group();
  }

  stretchPolygon() {
    for (const key in this.nodes) {
      if (Object.prototype.hasOwnProperty.call(this.nodes, key)) {
        this.nodes[key] = this.nodes[key].transform(this.stretch);
      }
    }
  }

  setPolygonColors() {
    for (let index = 0; index < this.polygons.length; index++) {
      const randomColor: string =
        "#" + Math.floor(Math.random() * 16777215).toString(16);
      this.polygons[index].color = randomColor;
    }
  }

  drawPolygon = (polygonTemp: DisplayPolygonsRefNodes) => {
    if (!polygonTemp.color || !polygonTemp.id || !polygonTemp.nodes)
      throw new Error("No color found");
    /* const nodesArray: PointArrayAlias = this.convertHasToArray(
      polygonTemp.nodes
    ); */
    if (this.clearSvg) {
      const newPolygon = this.group
        .polygon(polygonTemp.nodes)
        .fill(polygonTemp.color);
      this.svgPolygon[polygonTemp.id] = newPolygon;
    } else {
      this.svgPolygon[polygonTemp.id].plot(polygonTemp.nodes);
      this.group.add(this.svgPolygon[polygonTemp.id]);
    }
  };

  convertHasToArray(vectorHash: VectorHash | undefined): PointArrayAlias {
    if (!vectorHash) return [];
    const temp: NumericArray[] = [];

    Object.keys(vectorHash).forEach(function (key) {
      const point: NumericArray = vectorHash[key].toArray();
      temp.push(point);
    });
    return temp as PointArrayAlias;
  }

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
    this.polygonTemp = [];
    this.rotatePolygon();

    this.sortPolygonArray();

    this.drawPolygonArray();
    this.clearSvg = false;
    requestAnimationFrame(this.renderAndUpdate);
  };

  sortAndScreen() {
    // INFO: iterate over the polygons and get the screen points and zIndex
    for (let index = 0; index < this.polygons.length; index++) {
      const ki = this.polygons[index] || {};

      const newPolygonsRefNodes: DisplayPolygonsRefNodes = {
        ...this.getPolygonPoints(ki),
        color: this.polygons[index].color,
        id: this.polygons[index].id,
        order: this.polygons[index].order,
      };
      this.polygonTemp.push(newPolygonsRefNodes);
    }
  }

  sortPolygonArray() {
    this.sortAndScreen();

    // sort polygons by zIndex
    this.polygonTemp = this.polygonTemp
      //.filter((item): item is PolygonsRefNodes => !!item.zIndex)
      .sort((a, b) => {
        return (a.zIndex || 0) - (b.zIndex || 0);
      });
    //this.polygonTemp = polygonSorted;
  }

  getPolygonPoints(
    polygonHash: PolygonsRefNodes
  ): Partial<DisplayPolygonsRefNodes> {
    let polygonPoints2: number[] = [];
    let zIndex: number = 0;

    //const hhhhh = Object.keys(polygonHash.nodes).sort((a, b) => polygonHash.order.indexOf(+a) - polygonHash.order.indexOf(+b));

    const hhhhh = polygonHash.order.flatMap((index) => {
      const vect = polygonHash.nodes[index];
      const [pointX1, pointY1, PointZ] = this.getScreenCoordinates(vect);
      zIndex += PointZ;
      return [pointX1, pointY1];
    });

    /* for (const key in polygonHash) {
      if (Object.prototype.hasOwnProperty.call(polygonHash, key)) {
        const [pointX1, pointY1, PointZ] = this.getScreenCoordinates(
          polygonHash[key]
        );
        zIndex += PointZ;
        polygonPoints2 = [...polygonPoints2, pointX1, pointY1];
      }
    } */

    return { nodes: hhhhh, zIndex: zIndex };
  }

  getNodesReferenceByPolygons(
    polygons: PolygonObj[],
    nodesVector: VectorHash
  ): PolygonsRefNodes[] {
    // INFO: iterate over the polygons and get the nodes reference
    const PolygonsRef: PolygonsRefNodes[] = [];
    for (const key in polygons) {
      if (Object.prototype.hasOwnProperty.call(polygons, key)) {
        const element = polygons[key];

        const randomColor: string =
          "#" + Math.floor(Math.random() * 16777215).toString(16);

        const tempPolygon: PolygonsRefNodes = {
          id: polygons[key].id,
          nodes: {},
          color: randomColor,
          order: polygons[key].points,
          zIndex: -200,
        };
        let zIndex: number = 0;
        polygons[key].points.forEach((point) => {
          zIndex += nodesVector[point].z;
          tempPolygon.nodes = {
            ...tempPolygon.nodes,
            [point]: nodesVector[point],
          };
          //[point.toString() as keyof VectorHash] = this.nodes[point];
        });
        tempPolygon.zIndex = zIndex;
        PolygonsRef.push(tempPolygon);
      }
    }

    return PolygonsRef;
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

    const polygonObjects: PolygonObj[] = [
      { id: "0", points: [0, 1, 2, 3] },
      { id: "1", points: [1, 5, 6, 2] },
      { id: "2", points: [5, 4, 7, 6] },
      { id: "3", points: [4, 0, 3, 7] },
      { id: "4", points: [4, 5, 1, 0] },
      { id: "5", points: [3, 2, 6, 7] },
    ];

    const polygonsRefNodes: PolygonsRefNodes[] =
      this.getNodesReferenceByPolygons(polygonObjects, nodesVector);

    return {
      points: nodesVector,
      polygons: polygonsRefNodes,
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

  getScreenCoordinates(vector: Vector4) {
    const transformV = this.fullTransform.transform(vector, this.tempVector);

    const [x, y, Z] = transformV;
    return [x, y, Z];
  }

  getPerspectiveMatrix() {
    const fovy = Math.PI * 0.5;
    this.perspectiveMatrix = new Matrix4();

    const perspective = this.perspectiveMatrix.orthographic({
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
}
