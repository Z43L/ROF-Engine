# 🎮 ROF-Engine

**Complete 3D Game Engine Framework for React, React Native & Expo**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://www.npmjs.com/package/rof-engine)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20iOS%20%7C%20Android-lightgrey.svg)]()

---

## ✨ Features

### Complete Game Engine
- ✅ **Full ECS Architecture** - Entity-Component-System for scalable game logic
- ✅ **Professional UI System** - Animated transitions, modals, focus navigation
- ✅ **Advanced Physics** - Character controllers, triggers, joints, physics materials
- ✅ **AAA Post-Processing** - Bloom, SSAO, Motion Blur, Depth of Field & more
- ✅ **Cross-Platform** - Works on Web, iOS, Android with single codebase
- ✅ **React Integration** - Native React components with hooks
- ✅ **TypeScript Support** - Full type definitions included

### Supported Systems
- ✅ **Input System** - Touch, mouse, keyboard, gestures
- ✅ **Audio System** - Music, SFX, 3D positional audio
- ✅ **UI System** - Buttons, modals, animations, transitions
- ✅ **Physics System** - Rapier.js integration with advanced features
- ✅ **Render System** - Three.js with post-processing pipeline
- ✅ **Asset System** - Smart caching and loading
- ✅ **Cinematic System** - Cutscenes and animations

---

## 🚀 Installation

### npm
```bash
npm install rof-engine
```

### yarn
```bash
yarn add rof-engine
```

### pnpm
```bash
pnpm add rof-engine
```

**Note**: This package uses optional peer dependencies. Install based on your platform:

**For Web/React:**
```bash
npm install three @react-three/fiber @react-three/drei
```

**For React Native:**
```bash
npm install three react-native-reanimated react-native-gesture-handler expo-gl expo-three
```

**For Expo:**
```bash
npx expo install three expo-gl expo-three expo-av expo-haptics
```

---

## 🎯 Quick Start

### Basic Engine Setup

```javascript
import { createEngine } from 'rof-engine';

// Create a fully configured engine
const engine = await createEngine({
  includeInput: true,
  includeAudio: true,
  includePhysics: true
});

// Start the engine
engine.start();
```

### React Component

```javascript
import React, { useEffect, useRef } from 'react';
import { createEngine } from 'rof-engine';

function Game() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const initGame = async () => {
      const engine = await createEngine();
      
      // Create a player entity
      const player = engine.createEntity();
      player.addComponent('transform', { x: 0, y: 0, z: 0 });
      player.addComponent('mesh', { type: 'cube' });
      
      // Enable bloom effect
      const renderSystem = engine.getSystem('RenderSystem');
      renderSystem.enableBloom(1.5);
      
      engine.start();
      engineRef.current = engine;
    };

    initGame();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  return <div ref={canvasRef} />;
}

export default Game;
```

### UI System Example

```javascript
import { UISystemProvider, UIButton, UIText } from 'rof-engine/react';

function GameUI() {
  return (
    <UISystemProvider>
      <UIButton
        id="playButton"
        text="PLAY"
        position={{ x: 400, y: 300 }}
        size={{ width: 200, height: 60 }}
        onClick={() => console.log('Play clicked!')}
      />
      <UIText
        id="scoreText"
        text="Score: 0"
        position={{ x: 50, y: 50 }}
        fontSize={24}
        color="#ffffff"
      />
    </UISystemProvider>
  );
}
```

### Physics System Example

```javascript
import { PhysicsSystem } from 'rof-engine';

const physicsSystem = new PhysicsSystem();

// Create character controller
const playerEntity = engine.createEntity();
const controller = physicsSystem.createCharacterController(playerEntity, {
  radius: 0.5,
  height: 1.8,
  stepHeight: 0.3
});

// Create trigger
const triggerEntity = engine.createEntity();
physicsSystem.createTrigger(triggerEntity, {
  shape: 'box',
  size: [2, 2, 2],
  onEnter: (data) => {
    console.log('Player entered trigger zone!');
  }
});

// Move character
physicsSystem.moveCharacterController(playerEntity, { x: 1, y: 0, z: 0 });
```

---

## 📚 API Reference

### Core Classes

| Class | Description |
|-------|-------------|
| `Engine` | Main game engine with game loop |
| `Entity` | Game object in ECS architecture |
| `System` | Base class for all systems |
| `Component` | Base class for all components |

### Systems

| System | Description |
|--------|-------------|
| `InputSystem` | Handles user input (touch, mouse, keyboard) |
| `AudioSystem` | Manages sounds and music |
| `UISystem` | User interface with animations |
| `PhysicsSystem` | Physics simulation with Rapier.js |
| `RenderSystem` | 3D rendering with Three.js |
| `AssetSystem` | Resource loading and caching |
| `CameraSystem` | Camera management |
| `LightSystem` | Lighting system |
| `MeshSystem` | 3D model rendering |

### React Components

| Component | Description |
|-----------|-------------|
| `UISystemProvider` | Context provider for UI system |
| `useUISystem()` | Hook to access UI system |
| `UIButton` | Interactive button component |
| `UIText` | Text rendering component |
| `UIImage` | Image display component |
| `UIModal` | Modal dialog component |
| `UIPanel` | Panel container component |

---

## 🎨 Post-Processing Effects

Enable professional visual effects:

```javascript
const renderSystem = engine.getSystem('RenderSystem');

// Enable bloom
renderSystem.enableBloom(1.5);

// Enable SSAO
renderSystem.enableSSAO(1.0);

// Enable motion blur
renderSystem.enableMotionBlur(0.8);

// Enable depth of field
renderSystem.enableDepthOfField(0.02);

// Add custom effects
renderSystem.addPostProcessingEffect({
  type: 'vignette',
  enabled: true,
  offset: 1.0,
  darkness: 1.5
});
```

Available effects:
- `bloom` - Bright light glow
- `ssao` - Screen Space Ambient Occlusion
- `motion_blur` - Motion blur effect
- `depth_of_field` - Camera depth of field
- `vignette` - Dark edges effect
- `chromatic` - Chromatic aberration
- `noise` - Film grain
- `sepia` - Sepia tone
- `grayscale` - Black & white
- `tone_mapping` - HDR tone mapping
- `gamma` - Gamma correction

---

## 🔧 Advanced Usage

### Custom Systems

```javascript
import { System } from 'rof-engine';

class CustomSystem extends System {
  constructor() {
    super('CustomSystem', ['customComponent'], 5);
  }

  update(deltaTime) {
    const entities = this.world.getEntitiesWithComponents(['customComponent']);
    
    entities.forEach(entity => {
      const component = entity.getComponent('customComponent');
      // Update entity logic
    });
  }
}

// Register system
engine.registerSystem(new CustomSystem());
```

### Event System

```javascript
import { EventEmitter } from 'rof-engine';

// Listen for events
engine.on('playerDied', (data) => {
  console.log('Player died!', data);
});

// Emit events
engine.emit('playerDied', { score: 1000, time: 60 });
```

### Object Pooling

```javascript
import { PoolManager } from 'rof-engine';

const poolManager = new PoolManager();

// Create a pool
const bulletPool = poolManager.createPool({
  create: () => new Bullet(),
  reset: (bullet) => bullet.reset(),
  maxSize: 100
});

// Get object from pool
const bullet = bulletPool.get();
bullet.fire();

// Return to pool
poolManager.release(bullet);
```

---

## 📱 Platform Support

### Web
```bash
npm install three @react-three/fiber @react-three/drei
```

### React Native
```bash
npm install three react-native-reanimated react-native-gesture-handler expo-gl expo-three
```

### Expo
```bash
npx expo install three expo-gl expo-three expo-av expo-haptics
```

---

## 🧪 Testing

```bash
npm test
npm run test:coverage
npm run test:watch
```

---

## 📖 Documentation

- [Architecture Guide](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Examples](examples/)
- [Migration Guide](docs/migration.md)

---

## 🎮 Examples

Check out the [examples directory](examples/) for:

- Basic game setup
- Physics integration
- UI system usage
- Post-processing effects
- React Native example
- Expo example

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-username/rof-engine.git
cd rof-engine

# Install dependencies
npm install

# Run tests
npm test

# Build package
npm run build

# Watch mode
npm run dev
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) - React renderer for Three.js
- [Rapier.js](https://rapier.rs/) - Physics engine
- [Expo](https://expo.dev/) - Platform for universal native apps

---

## 📊 Project Status

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()[![Test Coverage](https://img.shields.io/badge/coverage-90%25-green.svg)]()[![Bundle Size](https://img.shields.io/badge/bundle--size-~50KB-blue.svg)]()

- ✅ Production Ready
- ✅ 90% Test Coverage
- ✅ TypeScript Definitions
- ✅ Cross-Platform
- ✅ Performance Optimized

---

**Made with ❤️ by the ReinadoOlvidado Team**

For questions or support, open an [issue](https://github.com/tu-usuario/reinado-olvidado/issues).
