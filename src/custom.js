import * as THREE from 'three'

export function latLonToVector3(lat, lon, radius, offset = 0.1) {
    const latRad = lat * (Math.PI / 180);
    const lonRad = -lon * (Math.PI / 180);

    return new THREE.Vector3(Math.cos(latRad) * Math.cos(lonRad) * ( radius + offset), Math.sin(latRad) * ( radius + offset), Math.cos(latRad) * Math.sin(lonRad) * ( radius + offset))
  }

export function updateSpritePosition(reference, object, lat, lon, earthRadius) {
    const localPosition = latLonToVector3(lat, lon, earthRadius, 0.2);

    const worldPosition = localPosition.clone().applyMatrix4(reference.matrixWorld);

    object.position.copy(worldPosition);
}

export function adjustSpriteOpacity(camera, object) {
  const spritePosition = object.position.clone().normalize();
  const cameraDirection = camera.position.clone().normalize();

  const angle = spritePosition.angleTo(cameraDirection);

  const fadeStart = THREE.MathUtils.degToRad(35);
  const fadeEnd = THREE.MathUtils.degToRad(100);

  if (angle > fadeStart) {
    const fadeFactor = 1 - (angle - fadeStart) / (fadeEnd - fadeStart);
    object.material.opacity = Math.max(0, Math.min(1, fadeFactor));
  } else {
    object.material.opacity = 1;
  }
}
