<script setup>
import avatar from './assets/avatar.png'
import earthAsset from './assets/earth.jpg'
import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import { updateSpritePosition, adjustSpriteOpacity } from './custom.js';

// CONSTANTES
const earthRadius = 5;
let rotate = true

// SCENES & MESH
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 9);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setClearColor( 0xffffff, 1);

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load(earthAsset); 
const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,  
    bumpMap: earthTexture,  
    bumpScale: 0.05,  
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);


const ambientLight = new THREE.AmbientLight(0xffffff, 1.8); 
scene.add(ambientLight);

// Sprites (faces)
const sprites = [
  {
    lat: 40.69754,
    lon: -74.3093235,
    sprite: null,
    text: null
  },
  {
    lat: 19.1687382,
    lon: -96.305809,
    sprite: null,
    text: null
  },
  {
    lat: 48.864716, 
    lon: 2.349014,
    sprite: null,
    text: null
  }
]

const map = new THREE.TextureLoader().load(avatar)
for (const item of sprites) {
  const spriteMaterial = new THREE.SpriteMaterial({
    map,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.5, 0.5, 1);
  scene.add(sprite);
  item.sprite = sprite
}

const axesHelper = new THREE.AxesHelper( 5 );
axesHelper.position.x = 10
scene.add( axesHelper );

let labelDiv = document.getElementById("markerLabel");
let closeBtn = document.getElementById("closeButton");
closeBtn.addEventListener("pointerdown", event => {
  labelDiv.classList.add("hidden");
})
let label = new CSS2DObject(labelDiv);
scene.add(label)

const orbit = new OrbitControls(camera, renderer.domElement);

function toScreenPosition(obj, camera) {
    const vector = new THREE.Vector3();
    const canvas = renderer.domElement;

    // Convertir la position 3D en espace écran
    obj.getWorldPosition(vector);
    vector.project(camera);

    // Transformer en pixels dans le DOM
    const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-(vector.y * 0.5) + 0.5) * canvas.clientHeight;

    return { x, y };
}

function centerSpriteOnScreen(row) {
  const { sprite, lat, lon } = row

  console.log('camera', camera.position, camera.rotation)
  // console.log('earth', earth.position, earth.rotation)
  console.log('sprite', sprite.position, sprite.rotation)
  console.log('-----')

  let divID = document.getElementById("text");

  if (rotate) {
    rotate = false
    
    divID.innerHTML = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum`;

    const screenPosition = toScreenPosition(sprite, camera);

    // Placer le label aux coordonnées écran calculées
    label.element.style.left = `${screenPosition.x}px`;
    label.element.style.top = `${screenPosition.y}px`;

    label.element.classList.remove("hidden");
    orbit.enabled = false
  } else {
    rotate = true
    orbit.enabled = true
    label.element.classList.add('hidden')
  }
}

function animate() {
    requestAnimationFrame(animate);

    if (rotate) {
      earth.rotation.y += 0.001
    
      // Mise à jour de la position du sprite en fonction des coordonnées géographiques
      for (const sprite of sprites) {
        updateSpritePosition(earth, sprite.sprite, sprite.lat, sprite.lon, earthRadius);
        adjustSpriteOpacity(camera, sprite.sprite)
      }
    }

    // Rendu de la scène
    renderer.render(scene, camera);
}

animate();

// Ajuster la taille du rendu lors du redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

renderer.domElement.addEventListener('click', function (event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    for (const sprite of sprites) {
      const intersects = raycaster.intersectObject(sprite.sprite);
      if (intersects.length > 0) {
        centerSpriteOnScreen(sprite);
      }
    }
    
  });

  closeBtn.addEventListener('pointerdown', () => {
    rotate = true
    orbit.enabled = true
    label.element.classList.add('hidden')
  })

</script>