import React from 'react';
import { Canvas } from '@react-three/fiber/native';
import Game from './src/Game';

export default function App() {
  return (
    <Canvas>
      <Game />
    </Canvas>
  );
}