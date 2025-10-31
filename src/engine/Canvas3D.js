import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useGLTF } from '@react-three/drei/native';

/**
 * Canvas3D - Componente principal del motor de renderizado 3D
 * Integra expo-gl con react-three-fiber para renderizado 3D en React Native
 */
export default function Canvas3D({ children, style, onCreated, ...props }) {
  return (
    <View style={[styles.container, style]}>
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 75 }}
        gl={{ antialias: true }}
        onCreated={onCreated}
        {...props}
      >
        {children}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
