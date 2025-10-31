# 🎮 Reinado Olvidado Framework

**Framework completo para desarrollo de videojuegos 3D en React, React Native y Expo**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/tu-usuario/reinado-olvidado)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20iOS%20%7C%20Android-lightgrey.svg)]()

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Instalación](#-instalación)
- [Inicio Rápido](#-inicio-rápido)
- [Arquitectura](#-arquitectura)
- [Sistemas Disponibles](#-sistemas-disponibles)
- [Documentación](#-documentación)
- [Ejemplos](#-ejemplos)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)

---

## ✨ Características

### Core Engine
- ✅ **Sistema ECS (Entity-Component-System)** completo y optimizado
- ✅ **Game Loop** de alto rendimiento con control de FPS
- ✅ **Event System** para comunicación entre sistemas
- ✅ **Object Pooling** para reducir garbage collection
- ✅ **Arquitectura multiplataforma** con adaptadores

### Sistemas Implementados
- ✅ **InputSystem**: Input táctil, mouse, teclado y gestos
- ✅ **AudioSystem**: Música, SFX, audio 3D posicional
- ✅ **AssetSystem**: Carga y gestión de recursos
- ✅ **CinematicSystem**: Sistema de cinemáticas avanzado
- ⏳ **PhysicsSystem**: Integración con Rapier.js (próximamente)
- ⏳ **UISystem**: Sistema de UI para juegos (próximamente)

### Plataformas Soportadas
- 🌐 **Web**: React + Three.js
- 📱 **React Native**: iOS y Android
- ⚡ **Expo**: Desarrollo rápido multiplataforma

---

## 📦 Instalación

### Para proyectos Expo (recomendado)

```bash
npm install reinado-olvidado

# Dependencias peer
npm install three @react-three/fiber @react-three/drei expo-gl expo-three
npm install expo-av expo-haptics react-native-reanimated react-native-gesture-handler
```

### Para proyectos React Native

```bash
npm install reinado-olvidado three @react-three/fiber @react-three/drei
npm install react-native-gesture-handler
```

### Para proyectos React Web

```bash
npm install reinado-olvidado three @react-three/fiber @react-three/drei
```

---

## 🚀 Inicio Rápido

### 1. Crear un Engine

```javascript
import { createEngine, logFrameworkInfo } from 'reinado-olvidado';

// Mostrar información del framework
logFrameworkInfo();

// Crear engine con sistemas automáticos
const engine = await createEngine({
  targetFPS: 60,
  includeInput: true,
  includeAudio: true,
  autoStart: true
});
```

### 2. Crear Entidades y Componentes

```javascript
import { createTransform } from 'reinado-olvidado/components/3d/Transform';

// Crear una entidad
const player = engine.createEntity();

// Agregar componentes
player.addComponent('transform', createTransform({
  x: 0,
  y: 0,
  z: 0
}));

player.addComponent('velocity', {
  x: 0,
  y: 0,
  z: 0
});

player.addTag('player');
```

### 3. Crear un Sistema Personalizado

```javascript
import { System } from 'reinado-olvidado';

class MovementSystem extends System {
  constructor() {
    super('MovementSystem', ['transform', 'velocity'], 50);
  }

  process(entities, deltaTime) {
    entities.forEach(entity => {
      const transform = entity.getComponent('transform');
      const velocity = entity.getComponent('velocity');

      transform.x += velocity.x * deltaTime;
      transform.y += velocity.y * deltaTime;
      transform.z += velocity.z * deltaTime;
    });
  }
}

// Registrar el sistema
engine.registerSystem(new MovementSystem());
```

### 4. Renderizar con React

```javascript
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Game } from 'reinado-olvidado/react/Game';
import { createEngine } from 'reinado-olvidado';

export default function MyGame() {
  const [engine, setEngine] = useState(null);

  useEffect(() => {
    createEngine({ autoStart: true }).then(setEngine);
  }, []);

  if (!engine) return <View><Text>Loading...</Text></View>;

  return (
    <View style={{ flex: 1 }}>
      <Game engine={engine}>
        {/* Escena 3D */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />

        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="royalblue" />
        </mesh>
      </Game>
    </View>
  );
}
```

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│           Your Game Code                │
├─────────────────────────────────────────┤
│         React Components                │
│    (Game, useEngine, etc.)              │
├─────────────────────────────────────────┤
│           Core Engine                   │
│  ┌──────────┬──────────┬──────────┐     │
│  │ Entities │ Systems  │  World   │     │
│  └──────────┴──────────┴──────────┘     │
├──────────┬──────────┬──────────┬────────┤
│  Input   │  Audio   │  Assets  │ Physics│
│  System  │  System  │  System  │ System │
├──────────┴──────────┴──────────┴────────┤
│         Platform Adapters               │
│  ┌──────────┬──────────┬──────────┐     │
│  │   Web    │  Native  │   Expo   │     │
│  └──────────┴──────────┴──────────┘     │
└─────────────────────────────────────────┘
```

### Principios de Diseño

1. **Platform Agnostic Core**: El engine no depende de ninguna plataforma
2. **Adapter Pattern**: Adaptadores específicos para cada plataforma
3. **ECS Pattern**: Separación clara entre datos (Components) y lógica (Systems)
4. **Composition over Inheritance**: Flexibilidad mediante composición
5. **Performance First**: Optimizado para 60fps en dispositivos móviles

---

## 🎯 Sistemas Disponibles

### InputSystem

```javascript
const inputSystem = engine.getSystem('InputSystem');

// Pointer/Touch
if (inputSystem.isPointerDown()) {
  const pos = inputSystem.getPointerPosition();
  console.log(pos.x, pos.y);
}

// Keyboard (solo web)
if (inputSystem.isKeyDown('space')) {
  player.jump();
}

// Virtual Joystick
const joystick = inputSystem.createVirtualJoystick({
  position: { x: 100, y: 100 },
  maxDistance: 100
});
```

### AudioSystem

```javascript
const audioSystem = engine.getSystem('AudioSystem');

// Cargar sonido
await audioSystem.loadSound('explosion', './assets/explosion.mp3', {
  category: 'sfx'
});

// Reproducir
const instanceId = audioSystem.playSound('explosion', {
  volume: 0.8,
  loop: false
});

// Audio 3D posicional
audioSystem.playSound('ambient', {
  is3D: true,
  position3D: { x: 10, y: 0, z: 5 },
  maxDistance: 50
});

// Control de volumen
audioSystem.setMasterVolume(0.7);
audioSystem.setCategoryVolume('music', 0.5);
```

### AssetSystem

```javascript
const assetSystem = engine.getSystem('AssetSystem');

// Registrar assets
assetSystem.registerAsset('hero', 'model', './models/hero.gltf');
assetSystem.registerAsset('sky', 'texture', './textures/sky.jpg');

// Cargar
const heroModel = await assetSystem.loadAsset('hero');

// Cargar grupo
await assetSystem.preloadGroup('level1');

// Obtener asset cargado
const model = assetSystem.getAsset('hero');
```

---

## 📚 Documentación

### Documentos Principales

- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitectura detallada del framework
- [QUICK_START.md](QUICK_START.md) - Guía de inicio rápido
- [CINEMATIC_SYSTEM_README.md](CINEMATIC_SYSTEM_README.md) - Sistema de cinemáticas
- [PERFORMANCE_CONSIDERATIONS.md](PERFORMANCE_CONSIDERATIONS.md) - Optimización

### API Reference

```javascript
// Engine
const engine = await createEngine(config);
engine.start();
engine.pause();
engine.resume();
engine.stop();
engine.reset();

// Entity
const entity = engine.createEntity();
entity.addComponent('transform', data);
entity.getComponent('transform');
entity.hasComponent('transform');
entity.removeComponent('transform');
entity.addTag('player');
entity.destroy();

// System
class MySystem extends System {
  constructor() {
    super('MySystem', ['transform'], priority);
  }

  update(deltaTime) {
    const entities = this.getEntities();
    // ...
  }
}

// World
const entities = engine.world.getEntitiesWithComponents('transform', 'velocity');
const tagged = engine.world.getEntitiesWithTag('enemy');
```

---

## 🎨 Ejemplos

### Ejemplo Básico (Expo)

```bash
cd examples/expo
npm install
npm start
```

### Crear un Juego de Plataformas

```javascript
// Crear jugador
const player = engine.createEntity();
player.addComponent('transform', createTransform({ x: 0, y: 0, z: 0 }));
player.addComponent('rigidbody', { mass: 1, type: 'dynamic' });
player.addComponent('collider', { shape: 'box', size: [1, 2, 1] });
player.addComponent('player', { speed: 5, jumpForce: 10 });

// Sistema de control del jugador
class PlayerControlSystem extends System {
  constructor() {
    super('PlayerControlSystem', ['transform', 'player'], 100);
  }

  update(deltaTime) {
    const inputSystem = this.world.getSystem('InputSystem');
    const joystick = inputSystem.getVirtualJoystick();

    this.forEach(entity => {
      const transform = entity.getComponent('transform');
      const player = entity.getComponent('player');

      if (joystick) {
        transform.x += joystick.x * player.speed * deltaTime;
        transform.z += joystick.y * player.speed * deltaTime;
      }
    });
  }
}
```

---

## 🗺️ Roadmap

### v0.1.0 (Actual) ✅
- [x] Core Engine con ECS
- [x] InputSystem multiplataforma
- [x] AudioSystem con audio 3D
- [x] AssetSystem con caché
- [x] Documentación básica
- [x] Ejemplo funcional

### v0.2.0 (En desarrollo) 🚧
- [ ] PhysicsSystem con Rapier.js
- [ ] UISystem para HUD y menús
- [ ] Collision System
- [ ] Particle System
- [ ] Más ejemplos (platformer, shooter)

### v0.3.0 (Planeado) 📋
- [ ] Networking/Multiplayer básico
- [ ] Save/Load System
- [ ] Advanced lighting
- [ ] Post-processing effects
- [ ] Mobile optimizations

### v1.0.0 (Futuro) 🎯
- [ ] Plugin ecosystem
- [ ] TypeScript completo
- [ ] Testing suite
- [ ] Performance profiler

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Sigue el estilo de código existente
- Agrega tests para nuevas funcionalidades
- Actualiza la documentación
- Asegúrate de que todo compile sin warnings

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - Renderizado 3D en React
- [Three.js](https://threejs.org/) - Librería 3D
- [Expo](https://expo.dev/) - Framework de desarrollo
- [Rapier](https://rapier.rs/) - Motor de física



## 🌟 Showcase

¿Creaste un juego con Reinado Olvidado? ¡Compártelo con nosotros!

---

<p align="center">
  <strong>Hecho con ❤️ por el equipo de Reinado Olvidado</strong>
</p>
