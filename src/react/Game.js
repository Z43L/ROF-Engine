/**
 * Game Component
 * Componente React principal para renderizar un juego
 * Compatible con Web, React Native y Expo
 */

import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Platform from '../utils/Platform.js';

/**
 * Componente Game
 * Renderiza el canvas 3D y gestiona el game loop
 */
export function Game({ engine, children, ...canvasProps }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (engine) {
      // Iniciar el engine si no está corriendo
      if (!engine.running) {
        engine.start();
      }

      setReady(true);

      return () => {
        // Pausar el engine al desmontar
        if (engine.running) {
          engine.pause();
        }
      };
    }
  }, [engine]);

  // Configuración específica de plataforma
  const canvasConfig = Platform.select({
    web: {
      style: { width: '100%', height: '100vh' },
      ...canvasProps
    },
    native: {
      style: { flex: 1 },
      ...canvasProps
    },
    default: {
      ...canvasProps
    }
  });

  if (!ready || !engine) {
    return null;
  }

  return (
    <Canvas {...canvasConfig}>
      {children}
    </Canvas>
  );
}

/**
 * Hook para usar el engine en componentes
 */
export function useEngine(engine) {
  const [stats, setStats] = useState(engine.stats);

  useEffect(() => {
    const updateStats = () => {
      setStats({ ...engine.stats });
    };

    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [engine]);

  return {
    engine,
    stats,
    createEntity: engine.createEntity.bind(engine),
    getSystem: engine.getSystem.bind(engine)
  };
}

export default Game;
