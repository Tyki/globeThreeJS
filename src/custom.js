import * as THREE from 'three'

export function latLonToVector3(lat, lon, radius, offset = 0.1) {
  const latRad = lat * (Math.PI / 180)
  const lonRad = -lon * (Math.PI / 180)

  return new THREE.Vector3(
    Math.cos(latRad) * Math.cos(lonRad) * (radius + offset),
    Math.sin(latRad) * (radius + offset),
    Math.cos(latRad) * Math.sin(lonRad) * (radius + offset),
  )
}

export function updateSpritePosition(reference, object, lat, lon, earthRadius) {
  const localPosition = latLonToVector3(lat, lon, earthRadius, 0.2)

  const worldPosition = localPosition.clone().applyMatrix4(reference.matrixWorld)

  object.position.copy(worldPosition)
}

export function adjustSpriteOpacity(camera, object) {
  const spritePosition = object.sprite.position.clone().normalize()
  const cameraDirection = camera.position.clone().normalize()

  const angle = spritePosition.angleTo(cameraDirection)

  const fadeStart = THREE.MathUtils.degToRad(35)
  const fadeEnd = THREE.MathUtils.degToRad(100)

  if (!object.visibility) {
    object.sprite.material.opacity = 0
  } else if (angle > fadeStart) {
    const fadeFactor = 1 - (angle - fadeStart) / (fadeEnd - fadeStart)
    object.sprite.material.opacity = Math.max(0, Math.min(1, fadeFactor))
  } else {
    object.sprite.material.opacity = 1
  }
}

export function toScreenPosition(obj, camera, renderer) {
  const vector = new THREE.Vector3()
  const canvas = renderer.domElement

  // Convertir la position 3D en espace écran
  obj.getWorldPosition(vector)
  vector.project(camera)

  // Transformer en pixels dans le DOM
  const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth
  const y = (-(vector.y * 0.5) + 0.5) * canvas.clientHeight

  return { x, y }
}
