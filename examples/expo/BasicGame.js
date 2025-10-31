/**
 * BasicGame - Ejemplo básico del framework
 * Demuestra el uso del engine, sistemas y componentes
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createEngine, logFrameworkInfo } from '../../src/index.js';
import { Game, useEngine } from '../../src/react/Game.js';
import { createTransform, TransformHelpers } from '../../src/components/3d/Transform.js';

// Sistema de movimiento simple
class MovementSystem {
  constructor() {
    this.name = 'MovementSystem';
    this.componentTypes = ['transform', 'velocity'];
    this.priority = 50;
    this.enabled = true;
  }

  init(world) {
    this.world = world;
  }

  update(deltaTime) {
    const entities = this.world.getEntitiesWithComponents('transform', 'velocity');

    entities.forEach(entity => {
      const transform = entity.getComponent('transform');
      const velocity = entity.getComponent('velocity');

      // Aplicar velocidad
      TransformHelpers.translate(
        transform,
        velocity.x * deltaTime,
        velocity.y * deltaTime,
        velocity.z * deltaTime
      );

      // Rotar continuamente
      TransformHelpers.rotate(transform, 0, 0.5 * deltaTime, 0);
    });
  }

  destroy() {
    this.world = null;
  }
}

// Componente de juego 3D
function GameScene({ engine }) {
  return (
    <>
      {/* Luces */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Cubo rotando */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="royalblue" />
      </mesh>

      {/* Suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="lightgreen" />
      </mesh>
    </>
  );
}

// Componente principal
export default function BasicGame() {
  const [engine, setEngine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mostrar info del framework
    logFrameworkInfo();

    // Inicializar el engine
    async function initEngine() {
      try {
        // Crear engine con sistemas básicos
        const gameEngine = await createEngine({
          targetFPS: 60,
          autoStart: false
        });

        // Registrar sistema de movimiento
        const movementSystem = new MovementSystem();
        gameEngine.registerSystem(movementSystem);

        // Crear una entidad de ejemplo
        const cube = gameEngine.createEntity();
        cube.addComponent('transform', createTransform({
          x: 0,
          y: 0,
          z: 0
        }));
        cube.addComponent('velocity', {
          x: 0,
          y: 0.5,
          z: 0
        });
        cube.addTag('player');

        setEngine(gameEngine);
        setLoading(false);

        console.log('✅ Engine initialized successfully');
        console.log('📊 Stats:', gameEngine.stats);
      } catch (error) {
        console.error('❌ Failed to initialize engine:', error);
        setLoading(false);
      }
    }

    initEngine();

    return () => {
      if (engine) {
        engine.destroy();
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading game engine...</Text>
      </View>
    );
  }

  if (!engine) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Failed to initialize engine</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Canvas 3D */}
      <Game engine={engine}>
        <GameScene engine={engine} />
      </Game>

      {/* UI Overlay */}
      <GameUI engine={engine} />
    </View>
  );
}

// UI de control
function GameUI({ engine }) {
  const { stats } = useEngine(engine);

  const handlePause = () => {
    if (engine.paused) {
      engine.resume();
    } else {
      engine.pause();
    }
  };

  const handleReset = () => {
    engine.reset();
  };

  return (
    <View style={styles.ui}>
      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statText}>FPS: {stats.fps}</Text>
        <Text style={styles.statText}>Entities: {stats.world.entities}</Text>
        <Text style={styles.statText}>Systems: {stats.world.systems}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={handlePause}>
          <Text style={styles.buttonText}>
            {engine.paused ? 'Resume' : 'Pause'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100
  },
  ui: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none'
  },
  stats: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5
  },
  statText: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  },
  button: {
    backgroundColor: 'rgba(100,100,255,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
