import React from 'react';
import * as THREE from 'three';

/**
 * Ground - Componente de suelo/plano base
 */
export default function Ground({
  size = 50,
  color = '#2a2a4e',
  receiveShadow = true,
  gridHelper = true
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={receiveShadow}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {gridHelper && (
        <gridHelper args={[size, size / 2, '#444', '#333']} position={[0, 0.01, 0]} />
      )}
    </group>
  );
}
