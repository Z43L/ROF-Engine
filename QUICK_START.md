# Guía de Inicio Rápido - Sistema de Cinemáticas

## 5 Minutos para tu Primera Cinemática

### Paso 1: Instalar Dependencias (Opcional pero Recomendado)

```bash
# Instalar React Native Reanimated para mejor performance
npx expo install react-native-reanimated react-native-gesture-handler

# Instalar Audio
npx expo install expo-av

# Instalar efectos visuales (opcional)
npm install @react-three/postprocessing
```

### Paso 2: Configurar Babel

Editar `babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin'  // Agregar esta línea
    ],
  };
};
```

### Paso 3: Crear tu Primera Cinemática

Crear archivo `App.js`:

```javascript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useCinematic } from './src/cinematic';

export default function App() {
  const cinematic = useCinematic({
    id: 'my_first_cinematic',
    duration: 5000,
    onStart: () => console.log('🎬 Cinemática iniciada!'),
    onComplete: () => console.log('✅ Cinemática completada!')
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Primera Cinemática</Text>

      <Text style={styles.status}>
        Estado: {cinematic.state}
      </Text>

      <Text style={styles.progress}>
        Progreso: {(cinematic.progress * 100).toFixed(0)}%
      </Text>

      <View style={styles.controls}>
        {!cinematic.isPlaying && (
          <Pressable style={styles.button} onPress={cinematic.play}>
            <Text style={styles.buttonText}>▶ Reproducir</Text>
          </Pressable>
        )}

        {cinematic.isPlaying && (
          <Pressable style={styles.button} onPress={cinematic.pause}>
            <Text style={styles.buttonText}>⏸ Pausar</Text>
          </Pressable>
        )}

        {cinematic.isPaused && (
          <Pressable style={styles.button} onPress={cinematic.resume}>
            <Text style={styles.buttonText}>▶ Reanudar</Text>
          </Pressable>
        )}
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${cinematic.progress * 100}%` }
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30
  },
  status: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 10
  },
  progress: {
    fontSize: 16,
    color: '#4a90e2',
    marginBottom: 30
  },
  controls: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a90e2'
  }
});
```

### Paso 4: Ejecutar

```bash
npm start
# o
expo start
```

## Siguiente Nivel: Cinemática con 3D

### Crear archivo `GameIntro.js`:

```javascript
import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { Box, Sphere } from '@react-three/drei/native';
import { useCinematic } from './src/cinematic';

function AnimatedScene() {
  const heroRef = useRef();
  const enemyRef = useRef();

  const cinematic = useCinematic({
    id: 'battle_intro',
    duration: 10000,

    script: {
      setup: async (c) => {
        c.hero = heroRef.current;
        c.enemy = enemyRef.current;
      },

      onStart: async (c) => {
        // Héroe entra (0-3s)
        const timeline1 = c.timelineEngine.create({
          id: 'hero_entrance',
          duration: 3000,
          autoPlay: true,
          tracks: [{
            target: heroRef.current?.position,
            keyframes: [
              { time: 0, values: { x: -10, y: 0, z: 0 } },
              { time: 3000, values: { x: -2, y: 0, z: 0 } }
            ]
          }]
        });

        // Enemigo aparece (3-6s)
        setTimeout(() => {
          const timeline2 = c.timelineEngine.create({
            id: 'enemy_entrance',
            duration: 3000,
            autoPlay: true,
            tracks: [{
              target: enemyRef.current?.scale,
              keyframes: [
                { time: 0, values: { x: 0, y: 0, z: 0 } },
                { time: 3000, values: { x: 1, y: 1, z: 1 } }
              ]
            }]
          });
        }, 3000);
      }
    }
  });

  // Auto-play al montar
  React.useEffect(() => {
    cinematic.play();
  }, []);

  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Héroe (cubo azul) */}
      <Box ref={heroRef} args={[1, 1, 1]} position={[-10, 0, 0]}>
        <meshStandardMaterial color="blue" />
      </Box>

      {/* Enemigo (esfera roja) */}
      <Sphere ref={enemyRef} args={[0.75]} position={[2, 0, 0]}>
        <meshStandardMaterial color="red" />
      </Sphere>
    </Canvas>
  );
}

export default function GameIntro() {
  return (
    <View style={{ flex: 1 }}>
      <AnimatedScene />
    </View>
  );
}
```

## Uso con Componentes Declarativos

### Crear archivo `DeclarativeExample.js`:

```javascript
import React from 'react';
import { View, Text, Image } from 'react-native';
import {
  Cinematic,
  FadeIn,
  SlideIn,
  Scale,
  Sequence
} from './src/cinematic';

export default function DeclarativeExample() {
  return (
    <Cinematic
      config={{
        id: 'declarative_intro',
        duration: 8000,
        skippable: true
      }}
      showControls={true}
    >
      <Sequence autoPlay={true}>
        {/* Logo aparece con fade y escala */}
        <FadeIn duration={1000}>
          <Scale from={0.5} to={1} duration={1000}>
            <View style={{
              width: 200,
              height: 200,
              backgroundColor: '#4a90e2',
              borderRadius: 100,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 48, color: '#fff' }}>🎮</Text>
            </View>
          </Scale>
        </FadeIn>

        {/* Título desliza desde la izquierda */}
        <SlideIn from="left" duration={800} delay={1000}>
          <Text style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: '#fff'
          }}>
            Reino Olvidado
          </Text>
        </SlideIn>

        {/* Subtítulo aparece */}
        <FadeIn duration={600} delay={2000}>
          <Text style={{
            fontSize: 18,
            color: '#aaa'
          }}>
            Presiona para comenzar
          </Text>
        </FadeIn>
      </Sequence>
    </Cinematic>
  );
}
```

## Uso del Timeline Manual

```javascript
import React, { useRef } from 'react';
import { useTimeline } from './src/cinematic';

function TimelineExample() {
  const objectRef = useRef({ x: 0, y: 0, scale: 1 });

  const timeline = useTimeline({
    id: 'my_timeline',
    duration: 5000,
    autoPlay: true,

    tracks: [
      {
        id: 'position_track',
        target: objectRef.current,
        keyframes: [
          { time: 0, values: { x: 0, y: 0 } },
          { time: 2500, values: { x: 100, y: 50 } },
          { time: 5000, values: { x: 200, y: 0 } }
        ]
      },
      {
        id: 'scale_track',
        target: objectRef.current,
        property: 'scale',
        keyframes: [
          { time: 0, values: 1 },
          { time: 2500, values: 1.5 },
          { time: 5000, values: 1 }
        ]
      }
    ],

    onUpdate: (timeline, time) => {
      console.log('Time:', time);
      // Actualizar tu objeto aquí
    }
  });

  return (
    <View>
      <Text>Timeline Progress: {timeline.progress * 100}%</Text>
    </View>
  );
}
```

## Uso con Eventos

```javascript
import React, { useState, useEffect } from 'react';
import { useCinematicEvent } from './src/cinematic';
import { CinematicEvent } from './src/cinematic';

function EventExample() {
  const [message, setMessage] = useState('');

  // Escuchar eventos del sistema
  useCinematicEvent(CinematicEvent.START, (data) => {
    setMessage('Cinemática iniciada!');
  });

  useCinematicEvent(CinematicEvent.COMPLETE, (data) => {
    setMessage('Cinemática completada!');
  });

  // Escuchar eventos personalizados
  useCinematicEvent(CinematicEvent.CUSTOM, (data) => {
    if (data.type === 'boss_appear') {
      setMessage('¡El boss ha aparecido!');
    }
  });

  return (
    <View>
      <Text>{message}</Text>
    </View>
  );
}
```

## Scripts Predefinidos

Usar uno de los scripts de ejemplo:

```javascript
import { combatCinematic } from './src/cinematic';
import { getGlobalCinematicManager } from './src/cinematic';

function UsePredefinedScript() {
  React.useEffect(() => {
    const manager = getGlobalCinematicManager();

    // Registrar el script
    manager.register(combatCinematic);

    // Reproducir
    manager.play('combat_intro');

    return () => manager.clear();
  }, []);

  return <View>{/* Tu UI */}</View>;
}
```

## Helpers de API Rápida

```javascript
import {
  playCinematic,
  stopCurrentCinematic,
  createSequence,
  createParallel
} from './src/cinematic';

// Reproducir rápidamente
playCinematic({
  id: 'quick_cinematic',
  duration: 3000,
  onComplete: () => console.log('Done!')
});

// Detener
stopCurrentCinematic();

// Crear secuencia
const sequence = createSequence(
  { duration: 1000, /* ... */ },
  { duration: 2000, /* ... */ },
  { duration: 1500, /* ... */ }
);

// Crear paralelo
const parallel = createParallel(
  { duration: 2000, /* ... */ },
  { duration: 2000, /* ... */ }
);
```

## Debugging

### Activar logs

```javascript
const cinematic = useCinematic({
  id: 'debug_cinematic',
  duration: 5000,

  onStart: () => console.log('⏯ START'),
  onUpdate: (c, time) => console.log('⏱', time),
  onComplete: () => console.log('✅ COMPLETE'),

  script: {
    onStart: (c) => {
      console.log('Timeline count:', c.timelineEngine.timelines.size);
      console.log('Animation count:', c.animationEngine.animations.size);
    }
  }
});
```

### Ver estado del sistema

```javascript
import { getCinematicSystemState } from './src/cinematic';

const state = getCinematicSystemState();
console.log('System State:', state);
/*
{
  activeCinematic: 'intro',
  queueLength: 2,
  totalCinematics: 5,
  history: [...]
}
*/
```

## Recursos Adicionales

### Documentación
- `CINEMATIC_SYSTEM_README.md` - README principal
- `CINEMATIC_USAGE_EXAMPLES.md` - Más ejemplos
- `CINEMATIC_SYSTEM_ARCHITECTURE.md` - Arquitectura

### Ejemplos
- `examples/SimpleCinematicExample.js` - Ejemplo completo

### Scripts
- `src/cinematic/scripts/ExampleScripts.js` - Scripts de ejemplo

## Problemas Comunes

### "Module not found: react-native-reanimated"

```bash
npx expo install react-native-reanimated
# Reiniciar el servidor
```

### "Animation is slow/laggy"

Asegúrate de tener Reanimated configurado correctamente y usa worklets.

### "Cinematic doesn't start"

Verifica que llamas a `cinematic.play()` después de montar el componente:

```javascript
useEffect(() => {
  cinematic.play();
}, []);
```

### "Assets not loading"

Asegúrate de precargar assets antes de reproducir:

```javascript
await cinematic.load();
await cinematic.play();
```

## Próximos Pasos

1. ✅ Ejecutar ejemplo básico
2. 📖 Leer `CINEMATIC_USAGE_EXAMPLES.md`
3. 🎮 Crear tu propia cinemática
4. 🚀 Optimizar con `PERFORMANCE_CONSIDERATIONS.md`
5. 🏗️ Extender el sistema con tus propios componentes

---

**¡Listo! Ahora tienes todo para crear cinemáticas increíbles. 🎬**

¿Necesitas ayuda? Revisa la documentación completa o los ejemplos incluidos.
