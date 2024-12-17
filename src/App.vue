<script setup>
import gsap from 'gsap'
import avatar from './assets/avatar.png'
import earthAsset from './assets/earth_transparent.png'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import { toScreenPosition, updateSpritePosition, adjustSpriteOpacity } from './custom.js'

// CONSTANTES
const earthRadius = 5
const cameraRadius = 10
const animationDuration = 1
let rotate = true
let focusSprite = false

// SCENES & MESH
const scene = new THREE.Scene()
const labelScene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 0, cameraRadius)

const renderer = new THREE.WebGLRenderer()
const labelRenderer = new THREE.WebGLRenderer()

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
renderer.setClearColor(0xffffff, 1)

const textureLoader = new THREE.TextureLoader()

const earthTexture = textureLoader.load(earthAsset)
const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64)

const uniforms = {
  uTexture: { value: earthTexture },
  uCameraPosition: { value: camera.position },
  uOpacityFront: { value: 1.0 }, // Opacité de la face avant
  uOpacityBack: { value: 0.1 }, // Opacité de la face arrière
}

const earthTestMaterial = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
    vUv = uv; // Transmet les coordonnées UV
    vNormal = normalize(normalMatrix * normal); // Normales orientées correctement
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
  fragmentShader: `
uniform sampler2D uTexture;
uniform float uOpacityFront; // Opacité de la face visible (1.0 par défaut)
uniform float uOpacityBack;  // Opacité de la face cachée

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
    // Direction vue-caméra
    vec3 viewDir = normalize(-vPosition);
    
    // Produit scalaire pour détecter la face visible/cachée
    float facing = dot(viewDir, vNormal);

    // Condition stricte : face visible = opacité maximale
    float opacity = (facing > 0.0) ? uOpacityFront : uOpacityBack;

    // Appliquer la texture
    vec4 texColor = texture2D(uTexture, vUv);

    // Couleur finale avec opacité ajustée
    gl_FragColor = vec4(texColor.rgb, texColor.a * opacity);
}
`,
  transparent: true,
  side: THREE.DoubleSide, // On rend visible les deux côtés,
  depthWrite: false,
  depthTest: true,
})

const earth = new THREE.Mesh(earthGeometry, earthTestMaterial)
scene.add(earth)

const ambientLight = new THREE.AmbientLight(0xffffff, 1.8)
scene.add(ambientLight)

// Sprites (faces)
const sprites = [
  {
    lat: 40.69754,
    lon: -74.3093235,
    sprite: null,
    text: 'Je suis NY',
    visibility: true,
    size: 's',
  },
  {
    lat: 19.1687382,
    lon: -96.305809,
    sprite: null,
    text: 'Je suis Mexico je crois',
    visibility: true,
    size: 'm',
  },
  {
    lat: 48.864716,
    lon: 2.349014,
    sprite: null,
    text: 'Je suis Paris',
    visibility: true,
    size: 'l',
  },
]

const avatarTexture = new THREE.TextureLoader().load(avatar)
for (const item of sprites) {
  const spriteMaterial = new THREE.SpriteMaterial({
    map: avatarTexture,
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(spriteMaterial)

  const scaling = item.size === 's' ? 0.5 : item.size === 'm' ? 0.8 : 1
  sprite.scale.set(scaling, scaling, 1)
  scene.add(sprite)
  item.sprite = sprite
}

if (window.localStorage.debugMap) {
  // The X axis is red. The Y axis is green. The Z axis is blue.
  const axesHelper = new THREE.AxesHelper(10)
  axesHelper.position.x = 10
  scene.add(axesHelper)
}

let labelDiv = document.getElementById('markerLabel')
let closeBtn = document.getElementById('closeButton')
closeBtn.addEventListener('pointerdown', () => {
  orbit.enabled = true
  rotate = true
  focusSprite = false
  label.element.classList.add('hidden')
  for (const sprite of sprites) {
    sprite.visibility = true
  }
})

let label = new CSS2DObject(labelDiv)
labelScene.add(label)

const orbit = new OrbitControls(camera, renderer.domElement)
orbit.enableZoom = false
orbit.rotateSpeed = 0.3

function gsapCenterSpriteonScreen(point, sprite) {
  //hide all sprites
  for (const sprite of sprites) {
    sprite.visibility = false
  }

  focusSprite = true
  sprite.visibility = true

  rotate = false
  orbit.enabled = false
  const spherical = new THREE.Spherical()
  spherical.setFromVector3(point)

  // Calculate new camera position
  const phi = spherical.phi
  const theta = spherical.theta

  const newCameraPosition = new THREE.Vector3()
  newCameraPosition.setFromSphericalCoords(10, phi, theta)

  // Animate between starting point and clicked point, linear interpolation
  gsap.to(camera.position, {
    duration: animationDuration,
    x: newCameraPosition.x,
    y: newCameraPosition.y,
    z: newCameraPosition.z,
    onUpdate: () => {
      camera.lookAt(earth.position)
    },
    onComplete: () => {
      let divID = document.getElementById('text')
      divID.innerHTML = sprite.text

      const screenPosition = toScreenPosition(sprite.sprite, camera, renderer)

      // Placer le label aux coordonnées écran calculées
      label.element.style.left = `${screenPosition.x}px`
      label.element.style.top = `${screenPosition.y + 60}px`

      label.element.classList.remove('hidden')
      label.element.style.pointerEvents = 'auto'
    },
  })

  gsap.to(camera, {
    duration: animationDuration,
    onUpdate: () => {
      const currentDistance = camera.position.distanceTo(earth.position)
      const scaleFactor = cameraRadius / currentDistance
      camera.position.multiplyScalar(scaleFactor)
      camera.lookAt(earth.position)
    },
  })
}
function animate() {
  requestAnimationFrame(animate)

  if (rotate) {
    earth.rotation.y += 0.001
  }

  for (const sprite of sprites) {
    updateSpritePosition(earth, sprite.sprite, sprite.lat, sprite.lon, earthRadius)
    adjustSpriteOpacity(camera, sprite)
  }

  // Rendu de la scène
  renderer.render(scene, camera)
  labelRenderer.render(labelScene, camera)
  labelRenderer.domElement.style.pointerEvents = 'none'
}

animate()

// Ajuster la taille du rendu lors du redimensionnement de la fenêtre
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
})

renderer.domElement.addEventListener('click', function (event) {
  const mouse = new THREE.Vector2()
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  for (const sprite of sprites) {
    const intersects = raycaster.intersectObject(sprite.sprite)

    // Do not intercept clicks when modal is opened (IE: orbit controlls are disabled)
    if (intersects.length > 0 && orbit?.enabled) {
      gsapCenterSpriteonScreen(intersects[0].point, sprite)
    }
  }
})

renderer.domElement.addEventListener('pointerdown', () => {
  if (focusSprite) return
  rotate = false
})

renderer.domElement.addEventListener('pointerup', () => {
  if (focusSprite) return

  rotate = true
})
</script>
