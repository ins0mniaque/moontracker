import { AbsoluteOrientationSensor } from './motion-sensors.js';
import { GeolocationSensor } from './geolocation-sensor.js';

const orientation = new AbsoluteOrientationSensor({ frequency: 60 });
const geolocation = new GeolocationSensor({ frequency: 60 });

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(28, 1, 1, 1000);
camera.position.set(10, 10, 50);
camera.lookAt(scene.position);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, -1);
camera.add(light);

const arrow    = new THREE.Group();
const arrowMat = new THREE.MeshPhongMaterial({
    color: "gold"
});

const coneGeo  = new THREE.ConeBufferGeometry(2, 5, 32);
const coneMesh = new THREE.Mesh(coneGeo, arrowMat);
coneMesh.rotation.x = Math.PI / 2;
coneMesh.position.z = 2.5;
arrow.add(coneMesh);

const cylinderGeo  = new THREE.CylinderBufferGeometry(1, 1, 5, 32);
const cylinderMesh = new THREE.Mesh(cylinderGeo, arrowMat);
cylinderMesh.rotation.x = Math.PI / 2;
cylinderMesh.position.z = -2.5;
arrow.add(cylinderMesh);

scene.add(camera);
scene.add(arrow);

let W = window.innerWidth;
let H = window.innerHeight;

function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
}

window.addEventListener("resize", resize);

resize();

function requestSensors() {
    if (window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === 'function') {
        renderer.domElement.onclick = function () {
            window.DeviceMotionEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('devicemotion', startSensors, console.error);
                    }
                })
                .catch(console.error);
        }
    }
    else {
        startSensors();
    }
}

function startSensors() {
    renderer.domElement.removeAttribute("onclick");
    orientation.start();
    geolocation.start();
}

let device    = new THREE.Quaternion().identity().toArray();
let latitude  = 0;
let longitude = 0;

orientation.onreading = () => device = orientation.quaternion;
geolocation.onreading = () => { latitude = geolocation.latitude; longitude = geolocation.longitude; }

function animate() {
    const moon     = SunCalc.getMoonPosition(new Date(), latitude, longitude);
    const north    = new THREE.Quaternion().fromArray(device);
    const azimuth  = new THREE.Quaternion();
    const altitude = new THREE.Quaternion();

    azimuth .setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 + moon.altitude);
    altitude.setFromAxisAngle(new THREE.Vector3(0, 0, 1), moon.azimuth);
    
    arrow.quaternion.fromArray(north.multiply(azimuth).multiply(altitude).toArray()).invert();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
  
function main() {
    requestSensors();
    document.body.appendChild(renderer.domElement);
    requestAnimationFrame(animate);
}

window.addEventListener("load", main);