
import * as THREE from "three/webgpu";
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

function createImaginaryCube(x, y, z, l) {
    const points = [
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x+l, y+l, z),
        new THREE.Vector3(x, y+l, z+l),
        new THREE.Vector3(x+l, y, z+l),
    ];
    const geometry = new ConvexGeometry(points);
    const material = new THREE.MeshNormalMaterial();
    return new THREE.Mesh(geometry, material);
}

function createConeFractal(x, y, z, edge, depth, array) {
    if (depth <= 1) {
        array.push(createImaginaryCube(x, y, z, edge));
        return;
    }
    createConeFractal(x, y, z, edge / 2, depth - 1, array);
    createConeFractal(x + edge/2, y + edge / 2, z, edge / 2, depth - 1, array);
    createConeFractal(x, y + edge / 2, z + edge / 2, edge / 2, depth - 1, array);
    createConeFractal(x + edge / 2, y, z + edge / 2, edge / 2, depth - 1, array);
}

const boxSize = 1;
const cameraDist = boxSize * 5;

export class ImaginaryConeFractal {
    #width;
    #height;
    #canvas;
    #rotX;
    #rotY;
    #mouseX;
    #mouseY;
    #scene;
    #listener;
    #camera;

    #box;

    init(width, height, canvas) {
        this.#width = width;
        this.#height = height;
        this.#canvas = canvas;
        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x000000);
        this.#rotX = 0;
        this.#rotY = 0;
        this.#mouseX = 0;
        this.#mouseY = 0;
        this.#listener = (event) => {
            const canvasRect = this.#canvas.getBoundingClientRect();
            this.#mouseX = event.pageX - canvasRect.x;
            this.#mouseY = event.pageY - canvasRect.y;
        };
        window.addEventListener("mousemove", this.#listener);

        this.#camera = new THREE.OrthographicCamera(-boxSize*1.2, boxSize*1.2, boxSize*1.2, -boxSize*1.2, 0.01, cameraDist*2);
        this.#camera.position.set(0, 0, cameraDist);

        // 立方体
        const geometryBox = new THREE.EdgesGeometry(new THREE.BoxGeometry(boxSize, boxSize, boxSize));
        const materialBox = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 2,
        });
        this.#box = new THREE.LineSegments(geometryBox, materialBox);
        this.#box.position.set(boxSize*0.5, boxSize*0.5, boxSize*0.5);
        this.#scene.add(this.#box);

        // 正四面体フラクタル
        const cones = [];
        createConeFractal(0, 0, 0, boxSize, 5, cones);
        for (const cone of cones) {
            this.#scene.add(cone);
        }
    }

    tick(renderer) {
        const targetRotX = (this.#mouseX / this.#width) * 360 * 1.5;
        const targetRotY = (1 - 2 * this.#mouseY / this.#height) * 90;
        // イージング
        this.#rotX += (targetRotX - this.#rotX) * 0.4;
        this.#rotY += (targetRotY - this.#rotY) * 0.4;
        const radianX = -this.#rotX * Math.PI / 180;
        const radianY = -this.#rotY * Math.PI / 180;
        this.#camera.position.x = cameraDist * Math.sin(radianX) * Math.cos(radianY) + boxSize*0.5;
        this.#camera.position.y = cameraDist * Math.sin(radianY) + boxSize*0.5;
        this.#camera.position.z = cameraDist * Math.cos(radianX) * Math.cos(radianY) + boxSize*0.5;
        this.#camera.lookAt(new THREE.Vector3(boxSize*0.5, boxSize*0.5, boxSize*0.5));
        renderer.render(this.#scene, this.#camera);
    }

    dispose() {
        window.removeEventListener("mousemove", this.#listener);
    }
}
