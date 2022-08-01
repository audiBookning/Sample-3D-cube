import { Object3d } from '../3d/Object3d';
import { Svg3D } from '../3d/Svg3d';

const svgParent = document.getElementById("svgParentElement");

if (!svgParent) throw new Error("No svgParentElement found");

const obj3d = new Object3d({
  scale: [1.5, 1, 1],
});
const svg3D = new Svg3D(obj3d, svgParent, {
  rotation: 1.5,
});

svg3D.animateFrames();
//obj3d.render();

window.onbeforeunload = function () {
  canvasDelete();
  //return "Are you sure you want to leave?";
};

function canvasDelete() {
  svg3D?.svgdestroy();
}
