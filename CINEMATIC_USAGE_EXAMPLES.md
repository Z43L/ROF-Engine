# Ejemplos de Uso - Sistema de Cinemáticas

## 1. Uso Básico con Hooks

### Ejemplo Simple: Fade In/Out

```jsx
import React from 'react';
import { View, Text } from 'react-native';
import { useCinematic } from './cinematic/hooks/useCinematic';

function SimpleIntro() {
  const cinematic = useCinematic({
    id: 'simple_intro',
    duration: 3000,
    onStart: () => console.log('Started!'),
    onComplete: () => console.log('Completed!')
  });

  return (
    <View>
      <Text>Progress: {(cinematic.progress * 100).toFixed(0)}%</Text>

      {!cinematic.isPlaying && (
        <Button title="Play" onPress={cinematic.play} />
      )}

      {cinematic.isPlaying && (
        <Button title="Pause" onPress={cinematic.pause} />
      )}
    </View>
  );
}
```

## 2. Uso Declarativo con Componentes

### Ejemplo: Secuencia de Animaciones

```jsx
import React from 'react';
import { View, Text, Image } from 'react-native';
import {
  Cinematic,
  FadeIn,
  SlideIn,
  Scale,
  Sequence
} from './cinematic/components/CinematicComponent';

function GameIntro() {
  return (
    <Cinematic
      config={{
        id: 'game_intro',
        duration: 10000,
        skippable: true
      }}
      showControls={true}
    >
      <Sequence autoPlay={true}>
        {/* Logo aparece con fade */}
        <FadeIn duration={1000}>
          <Scale from={0.5} to={1} duration={1000}>
            <Image source={require('./assets/logo.png')} />
          </Scale>
        </FadeIn>

        {/* Título desliza desde la izquierda */}
        <SlideIn from="left" duration={800} delay={500}>
          <Text style={styles.title}>Reino Olvidado</Text>
        </SlideIn>

        {/* Subtítulo aparece */}
        <FadeIn duration={600} delay={1200}>
          <Text style={styles.subtitle}>Press to Start</Text>
        </FadeIn>
      </Sequence>
    </Cinematic>
  );
}
```

## 3. Timeline con Keyframes

### Ejemplo: Movimiento de Personaje

```jsx
import React, { useRef } from 'react';
import { useTimeline } from './cinematic/hooks/useCinematic';
import { Canvas } from '@react-three/fiber/native';
import { Box } from '@react-three/drei';

function CharacterCutscene() {
  const characterRef = useRef();

  const timeline = useTimeline({
    id: 'character_movement',
    duration: 5000,
    autoPlay: true,
    tracks: [
      {
        id: 'move_track',
        target: characterRef.current?.position,
        keyframes: [
          { time: 0, values: { x: -5, y: 0, z: 0 } },
          {
            time: 2000,
            values: { x: 0, y: 1, z: 0 },
            easing: 'easeInOut',
            onReach: () => console.log('Reached center!')
          },
          {
            time: 5000,
            values: { x: 5, y: 0, z: 0 },
            easing: 'easeOut'
          }
        ]
      }
    ]
  });

  return (
    <Canvas>
      <ambientLight />
      <Box ref={characterRef} args={[1, 1, 1]}>
        <meshStandardMaterial color="blue" />
      </Box>
    </Canvas>
  );
}
```

## 4. Cinemática Completa con Script

### Ejemplo: Introducción de Boss

```jsx
import React, { useEffect } from 'react';
import { getGlobalCinematicManager } from './cinematic/managers/CinematicManager';
import { CinematicEvent } from './cinematic/types';

function BossBattle() {
  useEffect(() => {
    const manager = getGlobalCinematicManager();

    // Registrar la cinemática
    const cinematic = manager.register({
      id: 'boss_intro',
      duration: 15000,
      skippable: true,

      // Script personalizado
      script: {
        setup: async (cinematic) => {
          // Cargar modelos
          console.log('Loading boss assets...');
        },

        onStart: async (cinematic) => {
          // FASE 1: Oscurecer pantalla
          const fadeTimeline = cinematic.timelineEngine.create({
            id: 'fade_to_black',
            duration: 2000,
            autoPlay: true
          });

          // FASE 2: Mostrar boss (después de 2s)
          setTimeout(() => {
            cinematic.eventBus.emit(CinematicEvent.CUSTOM, {
              type: 'spawn_boss',
              bossId: 'dragon_boss'
            });

            // Animar entrada del boss
            const bossTimeline = cinematic.timelineEngine.create({
              id: 'boss_entrance',
              duration: 5000,
              autoPlay: true
            });
          }, 2000);

          // FASE 3: Boss ruge (después de 7s)
          setTimeout(() => {
            cinematic.eventBus.emit(CinematicEvent.CUSTOM, {
              type: 'boss_roar'
            });

            // Camera shake
            const shakeTimeline = cinematic.timelineEngine.create({
              id: 'camera_shake',
              duration: 1000,
              autoPlay: true
            });
          }, 7000);

          // FASE 4: Mostrar nombre del boss (después de 10s)
          setTimeout(() => {
            cinematic.eventBus.emit(CinematicEvent.CUSTOM, {
              type: 'show_boss_name',
              name: 'Ancient Dragon'
            });
          }, 10000);

          // FASE 5: Fade out y comenzar batalla (después de 13s)
          setTimeout(() => {
            const fadeOutTimeline = cinematic.timelineEngine.create({
              id: 'fade_out',
              duration: 2000,
              autoPlay: true,
              onComplete: () => {
                cinematic.complete();
              }
            });
          }, 13000);
        },

        onComplete: (cinematic) => {
          // Iniciar la batalla real
          console.log('Boss battle starting!');
        }
      }
    });

    // Reproducir la cinemática
    manager.play('boss_intro');

    // Cleanup
    return () => {
      manager.clear();
    };
  }, []);

  return (
    <View>
      {/* Tu escena de juego aquí */}
    </View>
  );
}
```

## 5. Sprite Animado

### Ejemplo: Personaje con Sprite Sheet

```jsx
import React from 'react';
import { SpriteComponent } from './cinematic/components/CinematicComponent';

function AnimatedCharacter() {
  return (
    <SpriteComponent
      source={require('./assets/character_spritesheet.png')}
      frameWidth={64}
      frameHeight={64}
      frameCount={8}
      fps={12}
      loop={true}
      autoPlay={true}
      style={{ width: 64, height: 64 }}
    />
  );
}
```

## 6. Diálogo Cinemático

### Ejemplo: Escena de Conversación

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCinematicEvent } from './cinematic/hooks/useCinematic';
import { CinematicEvent } from './cinematic/types';

function DialogueScene() {
  const [currentDialogue, setCurrentDialogue] = useState(null);

  // Escuchar eventos de diálogo
  useCinematicEvent(CinematicEvent.CUSTOM, (data) => {
    if (data.type === 'show_dialogue') {
      setCurrentDialogue({
        character: data.character,
        text: data.text
      });
    } else if (data.type === 'hide_dialogue') {
      setCurrentDialogue(null);
    }
  });

  return (
    <View style={styles.container}>
      {currentDialogue && (
        <View style={styles.dialogueBox}>
          <Text style={styles.characterName}>
            {currentDialogue.character}
          </Text>
          <Text style={styles.dialogueText}>
            {currentDialogue.text}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20
  },
  dialogueBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10
  },
  characterName: {
    color: 'yellow',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  dialogueText: {
    color: 'white',
    fontSize: 16
  }
});
```

## 7. Cinemática con Cámara 3D

### Ejemplo: Vuelo de Cámara

```jsx
import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber/native';
import { PerspectiveCamera } from '@react-three/drei';
import { useCinematicCamera } from './cinematic/hooks/useCinematic';

function CameraFlythrough() {
  const cameraRef = useRef();

  useCinematicCamera(cameraRef, {
    mode: 'path',
    path: [
      { x: 0, y: 5, z: 10, time: 0 },
      { x: 5, y: 3, z: 5, time: 3000 },
      { x: 0, y: 2, z: 0, time: 6000 },
      { x: -5, y: 4, z: 5, time: 9000 },
      { x: 0, y: 5, z: 10, time: 12000 }
    ],
    smoothing: 0.1
  });

  return (
    <Canvas>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 5, 10]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Tu escena 3D aquí */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Canvas>
  );
}
```

## 8. Tutorial Interactivo

### Ejemplo: Tutorial de Juego

```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCinematic, useCinematicEvent } from './cinematic/hooks/useCinematic';
import { CinematicEvent } from './cinematic/types';

function GameTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState(null);

  // Escuchar eventos de highlight
  useCinematicEvent(CinematicEvent.CUSTOM, (data) => {
    if (data.type === 'highlight_element') {
      setHighlightElement(data.element);
    }
  });

  const cinematic = useCinematic({
    id: 'tutorial',
    skippable: false,
    script: {
      steps: [
        {
          instruction: 'Tap the move button',
          element: 'move_button',
          action: 'move'
        },
        {
          instruction: 'Tap the attack button',
          element: 'attack_button',
          action: 'attack'
        }
      ],

      onStart: (cinematic) => {
        // Mostrar primer paso
        setCurrentStep(0);
      }
    }
  });

  const handleUserAction = (action) => {
    // Emitir evento de acción del usuario
    cinematic.cinematic?.eventBus.emit(`user:${action}`, {});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Step {currentStep + 1}: {/* Instrucción actual */}
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          highlightElement === 'move_button' && styles.highlighted
        ]}
        onPress={() => handleUserAction('move')}
      >
        <Text>Move</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          highlightElement === 'attack_button' && styles.highlighted
        ]}
        onPress={() => handleUserAction('attack')}
      >
        <Text>Attack</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  instruction: {
    fontSize: 20,
    marginBottom: 20
  },
  button: {
    backgroundColor: '#ddd',
    padding: 20,
    margin: 10,
    borderRadius: 10
  },
  highlighted: {
    backgroundColor: 'yellow',
    borderWidth: 3,
    borderColor: 'orange'
  }
});
```

## 9. Efectos de Transición

### Ejemplo: Transiciones entre Escenas

```jsx
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { FadeIn, FadeOut, SlideIn } from './cinematic/components/CinematicComponent';

function SceneTransition() {
  const [scene, setScene] = useState('menu');

  return (
    <View style={{ flex: 1 }}>
      {scene === 'menu' && (
        <FadeIn duration={500}>
          <View style={styles.scene}>
            <Text>Main Menu</Text>
            <Button
              title="Start Game"
              onPress={() => setScene('game')}
            />
          </View>
        </FadeIn>
      )}

      {scene === 'game' && (
        <SlideIn from="right" duration={800}>
          <View style={styles.scene}>
            <Text>Game Scene</Text>
            <Button
              title="Back to Menu"
              onPress={() => setScene('menu')}
            />
          </View>
        </SlideIn>
      )}
    </View>
  );
}
```

## 10. Uso Avanzado: Composición

### Ejemplo: Cinemática con Múltiples Efectos

```jsx
import React from 'react';
import { Canvas } from '@react-three/fiber/native';
import { useCinematic } from './cinematic/hooks/useCinematic';
import { getGlobalEventBus } from './cinematic/core/EventBus';

function ComplexCinematic() {
  const cinematic = useCinematic({
    id: 'complex_scene',
    duration: 20000,

    script: {
      setup: async (c) => {
        // Precargar todos los assets
      },

      onStart: async (c) => {
        // Timeline 1: Cámara
        const cameraTimeline = c.timelineEngine.create({
          id: 'camera',
          duration: 20000
        });

        // Timeline 2: Personajes
        const charactersTimeline = c.timelineEngine.create({
          id: 'characters',
          duration: 20000
        });

        // Timeline 3: Efectos
        const effectsTimeline = c.timelineEngine.create({
          id: 'effects',
          duration: 20000
        });

        // Timeline 4: Audio
        const audioTimeline = c.timelineEngine.create({
          id: 'audio',
          duration: 20000
        });

        // Sincronizar todos los timelines
        cameraTimeline.play();
        charactersTimeline.play();
        effectsTimeline.play();
        audioTimeline.play();

        // Eventos en puntos específicos
        setTimeout(() => {
          c.eventBus.emit('custom:explosion', {});
        }, 5000);

        setTimeout(() => {
          c.eventBus.emit('custom:dialogue_start', {});
        }, 8000);

        setTimeout(() => {
          c.eventBus.emit('custom:final_shot', {});
        }, 15000);
      }
    }
  });

  return (
    <Canvas>
      {/* Tu escena 3D aquí */}
    </Canvas>
  );
}
```

## Consejos de Performance

1. **Usar React.memo para componentes pesados**
2. **Precargar assets antes de reproducir**
3. **Limitar el número de timelines concurrentes**
4. **Usar `useNativeDriver: true` en animaciones**
5. **Virtualizar listas de diálogos largos**
6. **Limpiar listeners y timers en cleanup**
7. **Evitar re-renders innecesarios con useMemo/useCallback**
