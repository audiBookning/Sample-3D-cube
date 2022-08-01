import { Object3d } from './Object3d';

let obj3d: Object3d | null = new Object3d([1.5, 1, 1]);

obj3d.renderAndUpdate();
//obj3d.render();

window.onbeforeunload = function () {
  canvasDelete();
  //return "Are you sure you want to leave?";
};

function canvasDelete() {
  // Write your business logic here
  console.log("hello");
  obj3d?.draw.remove();
}
