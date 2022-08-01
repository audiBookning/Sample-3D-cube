import { Object3d } from '../3d/Object3d';
import { Svg3D } from '../3d/Svg3d';

const svgParent = document.getElementById("svgParentElement");

if (!svgParent) throw new Error("No svgParentElement found");

const obj3d = new Object3d();
const svg3D = new Svg3D(obj3d, svgParent, {
  rotation: 1.5,
});
svg3D.animateFrames();

window.onbeforeunload = function () {
  canvasDelete();
};

function canvasDelete() {
  svg3D?.svgdestroy();
}
