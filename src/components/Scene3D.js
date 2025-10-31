import React from 'react';
import { useThree } from '@react-three/fiber/native';

/**
 * Scene3D - Componente de escena base con iluminación predeterminada
 */
export default function Scene3D({ children, backgroundColor = '#1a1a2e', fog = true }) {
  const { scene } = useThree();

  React.useEffect(() => {
    scene.background = new THREE.Color(backgroundColor);
    if (fog) {
      scene.fog = new THREE.Fog(backgroundColor, 10, 50);
    }
  }, [scene, backgroundColor, fog]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      {children}
    </>
  );
}
