/**
 * RenderSystem React Component
 * Integra el RenderSystem con React Three Fiber
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RenderSystem } from '../../systems/RenderSystem.js';

/**
 * Hook para usar el RenderSystem
 */
export function useRenderSystem() {
  const { scene, gl, camera } = useThree();
  const renderSystemRef = useRef(null);

  useEffect(() => {
    if (!renderSystemRef.current) {
      renderSystemRef.current = new RenderSystem();
      renderSystemRef.current.setScene(scene);
      renderSystemRef.current.setRenderer(gl);
      renderSystemRef.current.setCamera(camera);
    }

    return () => {
      if (renderSystemRef.current) {
        renderSystemRef.current.destroy();
        renderSystemRef.current = null;
      }
    };
  }, [scene, gl, camera]);

  return renderSystemRef.current;
}

/**
 * Componente React que integra el RenderSystem
 */
export default function RenderSystemComponent({
  children,
  shadows = true,
  shadowMapType = THREE.PCFSoftShadowMap,
  toneMapping = THREE.ACESFilmicToneMapping,
  toneMappingExposure = 1,
  physicallyCorrectLights = true,
  onStatsUpdate,
  quality = 'high',
  enablePostProcessing = false
}) {
  const renderSystem = useRenderSystem();
  const statsIntervalRef = useRef(null);

  // Configurar renderizador
  useEffect(() => {
    if (renderSystem?.current && gl) {
      renderSystem.current.config.shadowMap.enabled = shadows;
      renderSystem.current.config.shadowMap.type = shadowMapType;
      renderSystem.current.config.toneMapping = toneMapping;
      renderSystem.current.config.toneMappingExposure = toneMappingExposure;
      renderSystem.current.config.physicallyCorrectLights = physicallyCorrectLights;

      renderSystem.current.setPostProcessing(enablePostProcessing);
      renderSystem.current.setPerformance({ qualityLevel: quality });

      renderSystem.current._configureRenderer();
    }
  }, [renderSystem, gl, shadows, shadowMapType, toneMapping, toneMappingExposure, physicallyCorrectLights, enablePostProcessing, quality]);

  // Configurar callback de estadísticas
  useEffect(() => {
    if (!renderSystem?.current || !onStatsUpdate) return;

    const handleStatsUpdate = (data) => {
      onStatsUpdate(data.stats);
    };

    renderSystem.current.on('frameRendered', handleStatsUpdate);

    // Actualizar stats cada segundo
    statsIntervalRef.current = setInterval(() => {
      const stats = renderSystem.current.getStats();
      onStatsUpdate(stats);
    }, 1000);

    return () => {
      if (renderSystem?.current) {
        renderSystem.current.off('frameRendered', handleStatsUpdate);
      }
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [renderSystem, onStatsUpdate]);

  // Actualizar el render system en cada frame
  useFrame((state, delta) => {
    if (renderSystem?.current) {
      renderSystem.current.update(delta);
    }
  });

  return null;
}

/**
 * Componente para mostrar estadísticas de renderizado
 */
export function RenderStats({ stats, position = 'top-left' }) {
  if (!stats) return null;

  const positionClasses = {
    'top-left': 'absolute top-4 left-4',
    'top-right': 'absolute top-4 right-4',
    'bottom-left': 'absolute bottom-4 left-4',
    'bottom-right': 'absolute bottom-4 right-4'
  };

  return (
    <div className={`bg-black bg-opacity-70 text-white p-4 rounded font-mono text-sm ${positionClasses[position]}`}>
      <div>FPS: {stats.fps}</div>
      <div>Frame: {stats.renderTime.toFixed(2)}ms</div>
      <div>Draw Calls: {stats.drawCalls}</div>
      <div>Triangles: {stats.triangles.toLocaleString()}</div>
      <div>Geometries: {stats.geometries}</div>
      <div>Textures: {stats.textures}</div>
      <div>Quality: {stats.qualityLevel}</div>
    </div>
  );
}

/**
 * Wrapper para Canvas con configuraciones predefinidas
 */
export function GameCanvas({
  children,
  style,
  shadows = true,
  cameraPosition = [0, 5, 10],
  fov = 75,
  enableStats = false,
  quality = 'high',
  onStats,
  ...props
}) {
  const canvasStyle = {
    width: '100%',
    height: '100%',
    ...style
  };

  return (
    <>
      <Canvas
        style={canvasStyle}
        shadows={shadows}
        camera={{ position: cameraPosition, fov }}
        gl={{
          antialias: true,
          shadowMap: { enabled: shadows, type: THREE.PCFSoftShadowMap },
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          physicallyCorrectLights: true
        }}
        {...props}
      >
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow={shadows}
          shadow-mapSize-width={quality === 'ultra' ? 2048 : quality === 'high' ? 1024 : 512}
          shadow-mapSize-height={quality === 'ultra' ? 2048 : quality === 'high' ? 1024 : 512}
        />
        <React.Suspense fallback={null}>
          {children}
        </React.Suspense>
      </Canvas>
      {enableStats && onStats && <RenderStats stats={onStats} />}
    </>
  );
}

// Re-exportar Canvas desde @react-three/fiber
export { Canvas } from '@react-three/fiber';