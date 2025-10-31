# ReinadoOlvidado Framework - Arquitectura Multiplataforma

## Visión General

Framework completo para desarrollo de videojuegos 3D compatible con:
- **React Web** (usando Three.js)
- **React Native** (Android/iOS con expo-gl)
- **Expo** (desarrollo rápido)

## Principios de Diseño

1. **Platform Agnostic Core**: El core del engine no depende de ninguna plataforma
2. **Adapter Pattern**: Adaptadores específicos para cada plataforma
3. **Composition over Inheritance**: Sistema ECS puro
4. **Modular**: Cada sistema es independiente y opcional
5. **Performance First**: Optimizado para 60fps

## Estructura de Carpetas

```
src/
├── core/                    # Core engine (platform-agnostic)
│   ├── Engine.js           # Motor principal
│   ├── Entity.js           # Sistema de entidades
│   ├── Component.js        # Sistema de componentes
│   ├── System.js           # Sistema base
│   └── World.js            # Mundo del juego
│
├── systems/                 # Sistemas del motor
│   ├── PhysicsSystem.js    # Sistema de física
│   ├── InputSystem.js      # Sistema de input
│   ├── AudioSystem.js      # Sistema de audio
│   ├── RenderSystem.js     # Sistema de renderizado
│   ├── CollisionSystem.js  # Sistema de colisiones
│   └── AssetSystem.js      # Sistema de assets
│
├── adapters/               # Adaptadores de plataforma
│   ├── web/               # Adaptador React Web
│   │   ├── WebInputAdapter.js
│   │   ├── WebAudioAdapter.js
│   │   └── WebRenderer.js
│   │
│   ├── native/            # Adaptador React Native
│   │   ├── NativeInputAdapter.js
│   │   ├── NativeAudioAdapter.js
│   │   └── NativeRenderer.js
│   │
│   └── expo/              # Adaptador Expo (extiende native)
│       ├── ExpoInputAdapter.js
│       ├── ExpoAudioAdapter.js
│       └── ExpoRenderer.js
│
├── components/             # Componentes de juego
│   ├── 3d/                # Componentes 3D
│   │   ├── Transform.js   # Posición, rotación, escala
│   │   ├── Mesh.js        # Componente de malla
│   │   ├── Camera.js      # Componente de cámara
│   │   ├── Light.js       # Componente de luz
│   │   └── RigidBody.js   # Cuerpo físico
│   │
│   ├── gameplay/          # Componentes de gameplay
│   │   ├── Health.js      # Sistema de salud
│   │   ├── Inventory.js   # Inventario
│   │   ├── Movable.js     # Movimiento
│   │   └── Damageable.js  # Recibir daño
│   │
│   └── ui/                # Componentes UI
│       ├── HUD.js         # HUD del juego
│       ├── Menu.js        # Menús
│       └── Dialog.js      # Diálogos
│
├── react/                  # Componentes React
│   ├── Game.js            # Componente principal
│   ├── Scene.js           # Componente de escena
│   ├── useGame.js         # Hook principal
│   ├── useEntity.js       # Hook de entidades
│   └── useSystem.js       # Hook de sistemas
│
├── cinematic/             # Sistema cinemático (ya existe)
│   └── ...                # Mantener código existente
│
├── utils/                 # Utilidades
│   ├── Math.js            # Utilidades matemáticas
│   ├── Pool.js            # Object pooling
│   ├── EventEmitter.js    # Emisor de eventos
│   └── Platform.js        # Detección de plataforma
│
└── index.js               # Export principal

examples/
├── web/                   # Ejemplos React Web
│   ├── basic-game/
│   └── platformer/
│
├── native/                # Ejemplos React Native
│   ├── basic-game/
│   └── platformer/
│
└── expo/                  # Ejemplos Expo
    ├── basic-game/
    └── platformer/
```

## Arquitectura del Core Engine

### 1. Engine (Motor Principal)

```javascript
class Engine {
  constructor(config) {
    this.world = new World();
    this.systems = new Map();
    this.running = false;
    this.deltaTime = 0;
    this.lastTime = 0;
  }

  registerSystem(system) { }
  update(time) { }
  start() { }
  stop() { }
}
```

### 2. Entity-Component-System (ECS)

**Entity**: Solo un ID único
```javascript
class Entity {
  constructor(id) {
    this.id = id;
    this.components = new Map();
  }
}
```

**Component**: Solo datos, sin lógica
```javascript
class Component {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}
```

**System**: Toda la lógica del juego
```javascript
class System {
  constructor(componentTypes) {
    this.componentTypes = componentTypes;
  }

  update(entities, deltaTime) { }
}
```

### 3. Platform Adapters

Cada plataforma implementa interfaces estándar:

```javascript
// InputAdapter Interface
class InputAdapter {
  getPointerPosition() { }
  isKeyPressed(key) { }
  getTouchPoints() { }
  onGesture(callback) { }
}

// AudioAdapter Interface
class AudioAdapter {
  loadSound(uri) { }
  playSound(id, options) { }
  stopSound(id) { }
  setVolume(volume) { }
}

// RendererAdapter Interface
class RendererAdapter {
  createScene() { }
  createCamera() { }
  createMesh(geometry, material) { }
  render(scene, camera) { }
}
```

## Sistemas Principales

### 1. PhysicsSystem
- Integración con Rapier.js (web y WASM en native)
- Detección de colisiones
- Respuesta física
- Raycasting

### 2. InputSystem
- Mouse/Teclado (Web)
- Touch/Gestos (Mobile)
- Virtual Joystick
- Input mapping customizable

### 3. AudioSystem
- Música de fondo
- Efectos de sonido
- Audio 3D posicional
- Control de volumen por categoría

### 4. AssetSystem
- Precarga de assets
- Caché inteligente
- Streaming de assets grandes
- Gestión de memoria

### 5. RenderSystem
- Integración con React Three Fiber
- Optimización de draw calls
- Frustum culling
- LOD (Level of Detail)

## Detección y Selección de Plataforma

```javascript
// utils/Platform.js
export const Platform = {
  isWeb: typeof window !== 'undefined' && !window.navigator.product === 'ReactNative',
  isNative: typeof window !== 'undefined' && window.navigator.product === 'ReactNative',
  isExpo: typeof expo !== 'undefined',

  select(platforms) {
    if (this.isExpo && platforms.expo) return platforms.expo;
    if (this.isNative && platforms.native) return platforms.native;
    if (this.isWeb && platforms.web) return platforms.web;
    return platforms.default;
  }
};
```

## Uso del Framework

### Instalación

```bash
# Para proyectos web
npm install reinado-olvidado three @react-three/fiber @react-three/drei

# Para proyectos React Native
npm install reinado-olvidado three @react-three/fiber react-native-webgl

# Para proyectos Expo
npm install reinado-olvidado three @react-three/fiber expo-gl expo-three
```

### Ejemplo Básico

```jsx
import { Game, Entity, useGame } from 'reinado-olvidado';
import { Transform, Mesh, RigidBody } from 'reinado-olvidado/components';

function MyGame() {
  const game = useGame();

  useEffect(() => {
    // Crear entidad
    const player = game.createEntity();
    player.addComponent(new Transform({ x: 0, y: 0, z: 0 }));
    player.addComponent(new Mesh({ geometry: 'box', material: 'standard' }));
    player.addComponent(new RigidBody({ mass: 1, shape: 'box' }));

    // Registrar sistemas
    game.registerSystem(new PhysicsSystem());
    game.registerSystem(new InputSystem());
    game.registerSystem(new RenderSystem());

    game.start();
  }, []);

  return <Game engine={game} />;
}
```

## Compatibilidad de Features por Plataforma

| Feature | Web | React Native | Expo |
|---------|-----|--------------|------|
| Física (Rapier) | ✅ | ✅ | ✅ |
| Input Táctil | ✅ | ✅ | ✅ |
| Input Teclado | ✅ | ⚠️ | ⚠️ |
| Audio 3D | ✅ | ✅ | ✅ |
| Post-Processing | ✅ | ⚠️ | ⚠️ |
| Shadows | ✅ | ⚠️ | ⚠️ |
| GLTF Models | ✅ | ✅ | ✅ |
| Particles | ✅ | ⚠️ | ⚠️ |
| Networking | ✅ | ✅ | ✅ |

✅ = Soporte completo
⚠️ = Soporte limitado o con degradación

## Optimizaciones

### 1. Object Pooling
- Reuso de entidades
- Reuso de componentes
- Reducción de GC

### 2. Spatial Partitioning
- Octree para queries espaciales
- Optimización de colisiones

### 3. Batch Rendering
- Instanced rendering
- Material batching

### 4. Asset Streaming
- Carga progresiva
- Unload automático de assets no usados

## Próximos Pasos

1. ✅ Crear babel.config.js
2. 🔄 Implementar Core Engine
3. ⏳ Implementar Platform Adapters
4. ⏳ Implementar Physics System
5. ⏳ Implementar Input System
6. ⏳ Implementar Audio System
7. ⏳ Crear ejemplos para cada plataforma
8. ⏳ Escribir tests
9. ⏳ Optimizar performance
10. ⏳ Documentar API completa

## Referencias

- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Three.js](https://threejs.org/docs/)
- [Rapier Physics](https://rapier.rs/)
- [ECS Pattern](https://en.wikipedia.org/wiki/Entity_component_system)
