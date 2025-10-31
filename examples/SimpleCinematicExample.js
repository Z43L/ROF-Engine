/**
 * EJEMPLO COMPLETO: Cinemática Simple Integrada con Three.js
 * Demuestra cómo usar el sistema de cinemáticas con React Three Fiber
 */

import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { OrbitControls, Box, Sphere, Plane } from '@react-three/drei/native';
import { useCinematic } from '../src/cinematic/hooks/useCinematic';
import { CinematicEvent } from '../src/cinematic/types';

/**
 * Escena 3D con objetos animados
 */
function Scene3D({ cinematicRef }) {
  const heroRef = useRef();
  const enemyRef = useRef();
  const cameraRef = useRef();

  // Configurar la cinemática
  const cinematic = useCinematic({
    id: 'battle_intro',
    duration: 12000,
    skippable: true,

    script: {
      setup: async (c) => {
        // Guardar referencias
        c.hero = heroRef.current;
        c.enemy = enemyRef.current;
        c.camera = cameraRef.current;

        console.log('✓ Cinematic setup complete');
      },

      onStart: async (c) => {
        console.log('🎬 Starting cinematic...');

        // FASE 1: Héroe entra en escena (0-3s)
        const heroEntranceTimeline = c.timelineEngine.create({
          id: 'hero_entrance',
          duration: 3000,
          autoPlay: true,
          tracks: [
            {
              id: 'hero_move',
              target: heroRef.current?.position,
              property: null,
              keyframes: [
                {
                  time: 0,
                  values: { x: -10, y: 0, z: 0 }
                },
                {
                  time: 3000,
                  values: { x: -2, y: 0, z: 0 },
                  easing: 'easeOut',
                  onReach: () => {
                    console.log('⚔️ Hero ready!');
                    c.eventBus.emit(CinematicEvent.CUSTOM, {
                      type: 'hero_ready'
                    });
                  }
                }
              ]
            }
          ]
        });

        // FASE 2: Enemigo aparece (3-6s)
        setTimeout(() => {
          const enemyEntranceTimeline = c.timelineEngine.create({
            id: 'enemy_entrance',
            duration: 3000,
            autoPlay: true,
            tracks: [
              {
                id: 'enemy_scale',
                target: enemyRef.current?.scale,
                property: null,
                keyframes: [
                  { time: 0, values: { x: 0, y: 0, z: 0 } },
                  {
                    time: 2000,
                    values: { x: 1.5, y: 1.5, z: 1.5 },
                    easing: 'elastic',
                    onReach: () => {
                      console.log('👹 Enemy appeared!');
                      c.eventBus.emit(CinematicEvent.CUSTOM, {
                        type: 'enemy_appear'
                      });
                    }
                  }
                ]
              },
              {
                id: 'enemy_position',
                target: enemyRef.current?.position,
                property: null,
                keyframes: [
                  { time: 0, values: { x: 10, y: 3, z: 0 } },
                  {
                    time: 2000,
                    values: { x: 2, y: 0, z: 0 },
                    easing: 'bounce'
                  }
                ]
              }
            ]
          });
        }, 3000);

        // FASE 3: Confrontación (6-9s)
        setTimeout(() => {
          const confrontationTimeline = c.timelineEngine.create({
            id: 'confrontation',
            duration: 3000,
            autoPlay: true,
            tracks: [
              {
                id: 'hero_jump',
                target: heroRef.current?.position,
                property: null,
                keyframes: [
                  { time: 0, values: { x: -2, y: 0, z: 0 } },
                  { time: 1000, values: { x: -1, y: 1, z: 0 } },
                  { time: 2000, values: { x: 0, y: 0, z: 0 } },
                  { time: 3000, values: { x: -2, y: 0, z: 0 } }
                ]
              },
              {
                id: 'enemy_react',
                target: enemyRef.current?.rotation,
                property: null,
                keyframes: [
                  { time: 0, values: { x: 0, y: 0, z: 0 } },
                  { time: 1500, values: { x: 0, y: Math.PI / 4, z: 0 } },
                  { time: 3000, values: { x: 0, y: 0, z: 0 } }
                ]
              }
            ]
          });

          c.eventBus.emit(CinematicEvent.CUSTOM, {
            type: 'battle_ready'
          });
        }, 6000);

        // FASE 4: Camera pan final (9-12s)
        setTimeout(() => {
          const cameraTimeline = c.timelineEngine.create({
            id: 'camera_final',
            duration: 3000,
            autoPlay: true,
            onComplete: () => {
              c.complete();
            }
          });
        }, 9000);
      },

      onComplete: (c) => {
        console.log('✅ Cinematic completed!');
        c.eventBus.emit(CinematicEvent.COMPLETE, {
          cinematicId: c.id
        });
      }
    }
  });

  // Guardar referencia para el componente padre
  React.useEffect(() => {
    if (cinematicRef) {
      cinematicRef.current = cinematic;
    }
  }, [cinematic, cinematicRef]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-10, 10, 5]} intensity={0.5} />

      {/* Suelo */}
      <Plane
        args={[20, 20]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
      >
        <meshStandardMaterial color="#2d5016" />
      </Plane>

      {/* Héroe (cubo azul) */}
      <Box ref={heroRef} args={[1, 1, 1]} position={[-10, 0, 0]}>
        <meshStandardMaterial color="#4a90e2" />
      </Box>

      {/* Enemigo (esfera roja) */}
      <Sphere ref={enemyRef} args={[0.75, 32, 32]} position={[10, 3, 0]}>
        <meshStandardMaterial color="#e24a4a" />
      </Sphere>

      {/* Controles (desactivados durante cinemática) */}
      {!cinematic.isPlaying && <OrbitControls />}
    </>
  );
}

/**
 * Controles de UI
 */
function CinematicControls({ cinematic }) {
  if (!cinematic) return null;

  return (
    <View style={styles.controls}>
      <View style={styles.controlsRow}>
        {!cinematic.isPlaying && !cinematic.isCompleted && (
          <Pressable style={styles.button} onPress={cinematic.play}>
            <Text style={styles.buttonText}>▶ Play</Text>
          </Pressable>
        )}

        {cinematic.isPlaying && (
          <Pressable style={styles.button} onPress={cinematic.pause}>
            <Text style={styles.buttonText}>⏸ Pause</Text>
          </Pressable>
        )}

        {cinematic.isPaused && (
          <Pressable style={styles.button} onPress={cinematic.resume}>
            <Text style={styles.buttonText}>▶ Resume</Text>
          </Pressable>
        )}

        {(cinematic.isPlaying || cinematic.isPaused) && (
          <>
            <Pressable style={styles.button} onPress={cinematic.stop}>
              <Text style={styles.buttonText}>⏹ Stop</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={cinematic.skip}>
              <Text style={styles.buttonText}>⏭ Skip</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${cinematic.progress * 100}%` }
          ]}
        />
      </View>

      {/* Estado */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Estado: {cinematic.state}
        </Text>
        <Text style={styles.statusText}>
          Progreso: {(cinematic.progress * 100).toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}

/**
 * Overlay de eventos (muestra mensajes durante la cinemática)
 */
function EventOverlay() {
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    const eventBus = require('../src/cinematic/core/EventBus').getGlobalEventBus();

    const unsubscribe = eventBus.on(CinematicEvent.CUSTOM, (data) => {
      switch (data.type) {
        case 'hero_ready':
          setMessage('⚔️ Héroe listo para la batalla!');
          break;
        case 'enemy_appear':
          setMessage('👹 ¡Un enemigo salvaje aparece!');
          break;
        case 'battle_ready':
          setMessage('⚡ ¡Que comience la batalla!');
          break;
      }

      // Limpiar mensaje después de 2s
      setTimeout(() => setMessage(''), 2000);
    });

    return unsubscribe;
  }, []);

  if (!message) return null;

  return (
    <View style={styles.overlay}>
      <Text style={styles.overlayText}>{message}</Text>
    </View>
  );
}

/**
 * Componente Principal
 */
export default function SimpleCinematicExample() {
  const cinematicRef = useRef();

  return (
    <View style={styles.container}>
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
        <Scene3D cinematicRef={cinematicRef} />
      </Canvas>

      <CinematicControls cinematic={cinematicRef.current} />
      <EventOverlay />

      {/* Título */}
      <View style={styles.header}>
        <Text style={styles.title}>Battle Cinematic Demo</Text>
        <Text style={styles.subtitle}>
          Presiona Play para comenzar la cinemática
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 5
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    padding: 15
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4a90e2',
    borderRadius: 3
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statusText: {
    color: '#aaa',
    fontSize: 12
  },
  overlay: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    transform: [{ translateY: -50 }]
  },
  overlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});
