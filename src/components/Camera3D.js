import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber/native';
import { PerspectiveCamera } from '@react-three/drei/native';
import * as THREE from 'three';

/**
 * Camera3D - Cámara personalizable con controles
 */
export default function Camera3D({
  position = [0, 5, 10],
  target = [0, 0, 0],
  fov = 75,
  follow = null, // Objeto a seguir
  followOffset = [0, 5, 10],
  followSmooth = 0.1,
  ...props
}) {
  const cameraRef = useRef();
  const targetPos = useRef(new THREE.Vector3(...target));

  useFrame((state, delta) => {
    if (!cameraRef.current) return;

    // Si hay un objeto a seguir
    if (follow?.current) {
      const followPos = follow.current.position;
      const newPos = new THREE.Vector3(
        followPos.x + followOffset[0],
        followPos.y + followOffset[1],
        followPos.z + followOffset[2]
      );

      // Suavizar el movimiento de la cámara
      cameraRef.current.position.lerp(newPos, followSmooth);

      // Mirar hacia el objetivo
      targetPos.current.lerp(followPos, followSmooth);
      cameraRef.current.lookAt(targetPos.current);
    }
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={position}
      fov={fov}
      {...props}
    />
  );
}
