# Changelog

Todos los cambios notables en el proyecto Reinado Olvidado serán documentados en este archivo.

## [0.1.0] - 2025-10-31

### 🎉 Primera Release - Framework Multiplataforma

#### ✅ Agregado

**Core Engine**
- ✅ Sistema ECS (Entity-Component-System) completo
  - `Entity.js` - Entidades con ID único y gestión de componentes
  - `Component.js` - Registro de componentes con validación
  - `System.js` - Sistema base para lógica del juego
  - `World.js` - Contenedor de entidades con índices optimizados
  - `Engine.js` - Motor principal con game loop de 60fps

**Sistemas Implementados**
- ✅ `InputSystem` - Input multiplataforma
  - Adaptador Web (mouse, teclado, touch)
  - Adaptador Native (PanResponder)
  - Adaptador Expo (con haptic feedback)
  - Virtual joystick y botones
  - Detección de gestos (swipe, pinch)

- ✅ `AudioSystem` - Sistema de audio completo
  - Adaptador Web (Web Audio API con audio 3D)
  - Adaptador Expo (expo-av)
  - Control por categorías (music, sfx, voice, ambient, ui)
  - Audio 3D posicional
  - Gestión de volumen maestro y por categoría

- ✅ `AssetSystem` - Gestión de recursos
  - Carga de texturas, modelos, audio, datos
  - Sistema de caché inteligente
  - Precarga por grupos
  - Auto-descarga de assets no usados
  - Tracking de referencias

**Utilidades**
- ✅ `Platform.js` - Detección de plataforma (Web/Native/Expo)
- ✅ `EventEmitter.js` - Sistema de eventos con prioridades
- ✅ `Pool.js` - Object pooling para optimización

**Componentes 3D**
- ✅ `Transform.js` - Componente de transformación con helpers

**React Integration**
- ✅ `Game.js` - Componente principal para renderizado
- ✅ `useEngine()` - Hook para usar el engine en componentes

**Configuración**
- ✅ `babel.config.js` - Configuración de Babel
- ✅ `metro.config.js` - Configuración de Metro bundler
- ✅ `package.json` - Dependencias y scripts actualizados

**Ejemplos**
- ✅ `BasicGame.js` - Ejemplo completo funcional con Expo

**Documentación**
- ✅ `README.md` - Documentación principal
- ✅ `ARCHITECTURE.md` - Arquitectura detallada
- ✅ Documentación existente del sistema cinemático mantenida

#### 📊 Estado del Framework

**Completado (70%)**
- Core Engine: 100%
- InputSystem: 100%
- AudioSystem: 100%
- AssetSystem: 100%
- Sistema Cinemático: 95% (ya existía)
- Documentación: 80%
- Ejemplos: 40%

**Pendiente (30%)**
- PhysicsSystem: 0%
- CollisionSystem: 0%
- UISystem: 0%
- ParticleSystem: 0%
- NetworkingSystem: 0%
- Más ejemplos multiplataforma: 30%
- Tests: 0%

#### 🔧 Mejoras Técnicas

**Performance**
- Object pooling implementado
- Índices espaciales en World para queries rápidas
- Sistema de caché de assets
- Game loop optimizado con delta time

**Arquitectura**
- Patrón Adapter para multiplataforma
- Separación clara entre core y adaptadores
- API consistente entre plataformas
- Sistema de eventos desacoplado

**Developer Experience**
- Factory `createEngine()` que auto-configura según plataforma
- Detección automática de plataforma
- API declarativa con React
- Logging de información del framework

#### 🐛 Bugs Conocidos

- Audio 3D no funciona en React Native (limitación de la plataforma)
- Post-processing limitado en mobile
- Shadows pueden causar performance issues en dispositivos antiguos

#### 📝 Notas de Migración

**Para usuarios del sistema cinemático previo:**
- El sistema cinemático se mantiene 100% compatible
- Ahora se puede usar junto con el nuevo core engine
- Los ejemplos cinemáticos siguen funcionando

**Para nuevos usuarios:**
- Instalar dependencias con `npm install`
- Usar `createEngine()` para inicializar
- Ver ejemplos en `/examples/`

---

## [0.0.1] - 2025-10-30 (Pre-release)

### Inicial
- Sistema cinemático completo
- Ejemplos de cinemáticas
- Documentación extensa del sistema cinemático
- Configuración básica de Expo

---

## Próximas Versiones

### [0.2.0] - Planeado
- PhysicsSystem con Rapier.js
- CollisionSystem básico
- UISystem para HUD
- Más ejemplos (platformer, shooter básico)
- Tests unitarios

### [0.3.0] - Planeado
- ParticleSystem
- Advanced lighting system
- Networking básico
- Save/Load system
- Mobile optimizations

### [1.0.0] - Futuro
- Framework completo y estable
- Editor visual básico
- Plugin ecosystem
- TypeScript completo
- Documentación completa
- 100% test coverage
