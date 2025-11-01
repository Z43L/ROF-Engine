/**
 * Light React Component
 * Componente React para luces 3D
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LightComponent } from '../components/3d/Light.js';

/**
 * Componente React para una luz direccional
 */
export function DirectionalLight({
  color = 0xffffff,
  intensity = 1,
  position = [0, 10, 0],
  target = [0, 0, 0],
  castShadow = true,
  shadowMapSize = 1024,
  shadowCamera = {},
  shadowBias = 0,
  visible = true,
  helper = false,
  onCreated
}) {
  const lightRef = useRef();
  const targetRef = useRef();

  const shadowConfig = {
    mapSize: [shadowMapSize, shadowMapSize],
    camera: {
      left: -10,
      right: 10,
      top: 10,
      bottom: -10,
      near: 0.5,
      far: 50,
      ...shadowCamera
    }
  };

  React.useEffect(() => {
    if (onCreated && lightRef.current) {
      onCreated(lightRef.current);
    }
  }, [onCreated]);

  return (
    <>
      <directionalLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        position={position}
        castShadow={castShadow}
        visible={visible}
        shadow-mapSize={shadowConfig.mapSize}
        shadow-camera-left={shadowConfig.camera.left}
        shadow-camera-right={shadowConfig.camera.right}
        shadow-camera-top={shadowConfig.camera.top}
        shadow-camera-bottom={shadowConfig.camera.bottom}
        shadow-camera-near={shadowConfig.camera.near}
        shadow-camera-far={shadowConfig.camera.far}
        shadow-bias={shadowBias}
      />
      {helper && lightRef.current && (
        <directionalLightHelper args={[lightRef.current, 1]} />
      )}
    </>
  );
}

/**
 * Componente React para una luz puntual
 */
export function PointLight({
  color = 0xffffff,
  intensity = 1,
  distance = 0,
  decay = 2,
  position = [0, 10, 0],
  castShadow = true,
  shadowMapSize = 1024,
  visible = true,
  helper = false,
  onCreated
}) {
  const lightRef = useRef();

  React.useEffect(() => {
    if (onCreated && lightRef.current) {
      onCreated(lightRef.current);
    }
  }, [onCreated]);

  return (
    <>
      <pointLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        distance={distance}
        decay={decay}
        position={position}
        castShadow={castShadow}
        visible={visible}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
      />
      {helper && lightRef.current && (
        <pointLightHelper args={[lightRef.current, 1]} />
      )}
    </>
  );
}

/**
 * Componente React para una luz spotlight
 */
export function SpotLight({
  color = 0xffffff,
  intensity = 1,
  angle = Math.PI / 6,
  penumbra = 0,
  distance = 0,
  decay = 2,
  position = [0, 10, 0],
  target = [0, 0, 0],
  castShadow = true,
  shadowMapSize = 1024,
  shadowBias = 0,
  visible = true,
  helper = false,
  onCreated
}) {
  const lightRef = useRef();

  React.useEffect(() => {
    if (onCreated && lightRef.current) {
      onCreated(lightRef.current);
    }
  }, [onCreated]);

  return (
    <>
      <spotLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        distance={distance}
        decay={decay}
        position={position}
        castShadow={castShadow}
        visible={visible}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={shadowBias}
      />
      {target && (
        <object3D
          position={target}
          ref={(ref) => {
            if (ref && lightRef.current) {
              lightRef.current.target = ref;
            }
          }}
        />
      )}
      {helper && lightRef.current && (
        <spotLightHelper args={[lightRef.current]} />
      )}
    </>
  );
}

/**
 * Componente React para luz ambiental
 */
export function AmbientLight({
  color = 0xffffff,
  intensity = 0.2,
  visible = true,
  onCreated
}) {
  const lightRef = useRef();

  React.useEffect(() => {
    if (onCreated && lightRef.current) {
      onCreated(lightRef.current);
    }
  }, [onCreated]);

  return <ambientLight ref={lightRef} color={color} intensity={intensity} visible={visible} />;
}

/**
 * Componente React para luz hemisférica
 */
export function HemisphereLight({
  skyColor = 0xffffff,
  groundColor = 0x444444,
  intensity = 0.5,
  position = [0, 10, 0],
  visible = true,
  onCreated
}) {
  const lightRef = useRef();

  React.useEffect(() => {
    if (onCreated && lightRef.current) {
      onCreated(lightRef.current);
    }
  }, [onCreated]);

  return (
    <hemisphereLight
      ref={lightRef}
      args={[skyColor, groundColor, intensity]}
      position={position}
      visible={visible}
    />
  );
}