/**
 * Mesh React Component
 * Componente React para renderizar mallas 3D
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshComponent } from '../components/3d/Mesh.js';

/**
 * Componente React para un Mesh
 */
export default function Mesh({
  geometryType = 'box',
  geometryParams = {},
  materialType = 'standard',
  materialParams = {},
  castShadow = true,
  receiveShadow = true,
  visible = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  onCreated,
  onUpdate,
  children,
  ...props
}) {
  const meshRef = useRef();
  const geometry = useMemo(() => createGeometry(geometryType, geometryParams), [geometryType, geometryParams]);
  const material = useMemo(() => createMaterial(materialType, materialParams), [materialType, materialParams]);

  // Crear componente de mesh para el engine
  const meshComponent = useMemo(() => {
    return new MeshComponent({
      geometryType,
      geometryParams,
      materialType,
      materialParams,
      castShadow,
      receiveShadow,
      visible
    });
  }, [geometryType, geometryParams, materialType, materialParams, castShadow, receiveShadow, visible]);

  useEffect(() => {
    if (onCreated && meshRef.current) {
      onCreated(meshRef.current, meshComponent);
    }
  }, [onCreated, meshComponent]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
      meshRef.current.rotation.set(...rotation);
      meshRef.current.scale.set(...scale);

      if (onUpdate) {
        onUpdate(meshRef.current);
      }
    }
  }, [position, rotation, scale, onUpdate]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      visible={visible}
      {...props}
    >
      {children}
    </mesh>
  );
}

/**
 * Crea una geometría Three.js
 */
function createGeometry(type, params) {
  switch (type) {
    case 'box':
      const { width = 1, height = 1, depth = 1 } = params;
      return <boxGeometry args={[width, height, depth]} />;

    case 'sphere':
      const { radius = 0.5, widthSegments = 32, heightSegments = 16 } = params;
      return <sphereGeometry args={[radius, widthSegments, heightSegments]} />;

    case 'plane':
      const { width = 1, height = 1, widthSegments = 1, heightSegments = 1 } = params;
      return <planeGeometry args={[width, height, widthSegments, heightSegments]} />;

    case 'cylinder':
      const { radiusTop = 0.5, radiusBottom = 0.5, height = 1, radialSegments = 32 } = params;
      return <cylinderGeometry args={[radiusTop, radiusBottom, height, radialSegments]} />;

    case 'cone':
      const { radius = 0.5, height = 1, radialSegments = 32 } = params;
      return <coneGeometry args={[radius, height, radialSegments]} />;

    case 'torus':
      const { radius = 1, tube = 0.4, radialSegments = 16, tubularSegments = 100 } = params;
      return <torusGeometry args={[radius, tube, radialSegments, tubularSegments]} />;

    default:
      return <boxGeometry args={[1, 1, 1]} />;
  }
}

/**
 * Crea un material Three.js
 */
function createMaterial(type, params) {
  switch (type) {
    case 'basic':
      const { color = 0xffffff, wireframe = false } = params;
      return <meshBasicMaterial color={color} wireframe={wireframe} />;

    case 'lambert':
      const {
        color = 0xffffff,
        emissive = 0x000000,
        emissiveIntensity = 1,
        wireframe = false
      } = params;
      return (
        <meshLambertMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          wireframe={wireframe}
        />
      );

    case 'phong':
      const {
        color = 0xffffff,
        emissive = 0x000000,
        specular = 0x111111,
        shininess = 30,
        wireframe = false
      } = params;
      return (
        <meshPhongMaterial
          color={color}
          emissive={emissive}
          specular={specular}
          shininess={shininess}
          wireframe={wireframe}
        />
      );

    case 'standard':
      const {
        color = 0xffffff,
        metalness = 0,
        roughness = 1,
        emissive = 0x000000,
        emissiveIntensity = 1,
        wireframe = false
      } = params;
      return (
        <meshStandardMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          wireframe={wireframe}
        />
      );

    case 'physical':
      const {
        color = 0xffffff,
        metalness = 0,
        roughness = 0.5,
        clearcoat = 0,
        clearcoatRoughness = 0,
        transmission = 0,
        thickness = 0,
        wireframe = false
      } = params;
      return (
        <meshPhysicalMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          clearcoat={clearcoat}
          clearcoatRoughness={clearcoatRoughness}
          transmission={transmission}
          thickness={thickness}
          wireframe={wireframe}
        />
      );

    case 'toon':
      const { color = 0xffffff, gradientMap = null, wireframe = false } = params;
      return <meshToonMaterial color={color} gradientMap={gradientMap} wireframe={wireframe} />;

    case 'matcap':
      const { matcap = null, wireframe = false } = params;
      return <meshMatcapMaterial matcap={matcap} wireframe={wireframe} />;

    default:
      return <meshStandardMaterial color={0xffffff} />;
  }
}

/**
 * Presets de meshes comunes
 */
export const Box = (props) => <Mesh geometryType="box" {...props} />;
export const Sphere = (props) => <Mesh geometryType="sphere" {...props} />;
export const Plane = (props) => <Mesh geometryType="plane" {...props} />;
export const Cylinder = (props) => <Mesh geometryType="cylinder" {...props} />;
export const Cone = (props) => <Mesh geometryType="cone" {...props} />;
export const Torus = (props) => <Mesh geometryType="torus" {...props} />;