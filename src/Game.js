
import React, { useEffect } from 'react';
import { useGameEngine } from './engine/GameEngine';
import { getGlobalCinematicManager } from './cinematic/managers/CinematicManager';

export default function Game() {
  const engine = useGameEngine(engine => {
    // This is called when the engine is created
    const cinematicManager = getGlobalCinematicManager();
    engine.addSystem(cinematicManager);
  });

  return (
    <>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={'orange'} />
      </mesh>
    </>
  );
}
