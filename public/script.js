import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.127/build/three.module.js';
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.127/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.127/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19.0/dist/lil-gui.esm.min.js';

// Création de la scène
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f2f3f5'); // Noir
const light = new THREE.SpotLight(0xffffff, 1);
light.position.set(-43, 12.3, 20);
scene.add(light);

const container = document.getElementById('viewer');

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(-8, 1, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
document.getElementById('viewer').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const material = new THREE.MeshPhysicalMaterial({ color: 0xb2ffc8 });

let currentMesh = null;

// Fonction pour charger un fichier STL
function loadSTL(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const loader = new STLLoader();
        const geometry = loader.parse(event.target.result);

        // Calcul de la boîte englobante
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);

        // Recentrer le modèle
        geometry.center();

        const mesh = new THREE.Mesh(geometry, material);
        if (currentMesh) scene.remove(currentMesh);

        // Appliquer l'échelle et la rotation
        mesh.scale.set(0.1, 0.1, 0.1);
        mesh.rotation.x = -Math.PI / 2;

        scene.add(mesh);
        currentMesh = mesh;
        computeVolume(currentMesh.geometry);
    };
    reader.readAsArrayBuffer(file);
    
    

}

document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) loadSTL(file);
});

document.getElementById('colorPicker').addEventListener('input', function (event) {
    const color = event.target.value;
    if (currentMesh) {
        currentMesh.material.color.set(color);
    }
});


// Animation
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

const gui = new GUI();

// Paramètres de la lumière
const lightParams = {
    x: 20,
    y: 20,
    z: 20,
    intensity: 1,
};

// Ajout d'un dossier "Lumière" dans l'interface GUI
const lightFolder = gui.addFolder('Lumière');
lightFolder.add(lightParams, 'x', -50, 50).onChange((value) => light.position.x = value);
lightFolder.add(lightParams, 'y', -50, 50).onChange((value) => light.position.y = value);
lightFolder.add(lightParams, 'z', -50, 50).onChange((value) => light.position.z = value);
lightFolder.add(lightParams, 'intensity', 0, 2).onChange((value) => light.intensity = value);

// Ouvrir le dossier par défaut
lightFolder.open();

const cameraFolder = gui.addFolder('Caméra');

// Position
cameraFolder.add(camera.position, 'x', -10, 10).listen();
cameraFolder.add(camera.position, 'y', -10, 10).listen();
cameraFolder.add(camera.position, 'z', -10, 10).listen();

// Rotation
cameraFolder.add(camera.rotation, 'x', -Math.PI, Math.PI).listen();
cameraFolder.add(camera.rotation, 'y', -Math.PI, Math.PI).listen();
cameraFolder.add(camera.rotation, 'z', -Math.PI, Math.PI).listen();

// Champ de vision (FOV)
cameraFolder.add(camera, 'fov', 10, 120).onChange(() => {
    camera.updateProjectionMatrix();
});

// Ouvrir le menu par défaut
cameraFolder.open();

function computeVolume(geometry) {
    geometry.computeVertexNormals(); // Assure-toi que les normales sont bien calculées
    let position = geometry.attributes.position.array;
    let volume = 0;

    for (let i = 0; i < position.length; i += 9) {
        let ax = position[i], ay = position[i + 1], az = position[i + 2];
        let bx = position[i + 3], by = position[i + 4], bz = position[i + 5];
        let cx = position[i + 6], cy = position[i + 7], cz = position[i + 8];

        volume += (ax * (by * cz - bz * cy) +
                   bx * (bz * ay - az * by) +
                   cx * (az * by - ay * bz)) / 6;
    }

    volume = Math.abs(volume);
    document.getElementById('volume').textContent = volume.toFixed(2) ; 

    return volume;
}
