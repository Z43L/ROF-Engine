# Estructura de Carpetas Completa - Sistema de Cinemáticas

## Vista General

```
ReinadoOlvidado/
│
├── src/
│   ├── cinematic/                    # 🎬 SISTEMA DE CINEMÁTICAS
│   │   ├── core/                     # Motor principal
│   │   ├── managers/                 # Coordinadores
│   │   ├── components/               # Componentes React
│   │   ├── hooks/                    # React Hooks
│   │   ├── scripts/                  # Scripts de ejemplo
│   │   ├── effects/                  # Efectos visuales
│   │   ├── audio/                    # Audio
│   │   ├── timeline/                 # Timeline
│   │   ├── types/                    # Tipos
│   │   ├── utils/                    # Utilidades
│   │   └── index.js                  # Exportaciones
│   │
│   ├── engine/                       # Motor de juego existente
│   │   ├── GameEngine.js
│   │   ├── Canvas3D.js
│   │   └── index.js
│   │
│   └── components/                   # Componentes 3D existentes
│       ├── Scene3D.js
│       ├── Camera3D.js
│       └── Ground.js
│
├── examples/                         # 📚 EJEMPLOS
│   ├── SimpleCinematicExample.js    # Ejemplo básico
│   ├── AdvancedCinematicExample.js  # Ejemplo avanzado (por crear)
│   └── README.md                     # Guía de ejemplos
│
├── assets/                           # Recursos
│   ├── images/
│   ├── audio/
│   ├── models/
│   └── fonts/
│
├── docs/                             # 📖 DOCUMENTACIÓN
│   ├── CINEMATIC_SYSTEM_ARCHITECTURE.md
│   ├── CINEMATIC_USAGE_EXAMPLES.md
│   ├── PERFORMANCE_CONSIDERATIONS.md
│   ├── RECOMMENDED_LIBRARIES.md
│   ├── CINEMATIC_SYSTEM_README.md
│   └── FOLDER_STRUCTURE.md
│
├── App.js                            # Aplicación principal
├── index.js                          # Punto de entrada
├── package.json                      # Dependencias
├── babel.config.js                   # Configuración Babel
└── app.json                          # Configuración Expo
```

## Detalles por Carpeta

### 📁 src/cinematic/core/

**Propósito**: Motor principal del sistema

```
core/
├── EventBus.js              # Sistema pub/sub de eventos
│   └── Funciones:
│       - on(), off(), once()
│       - emit(), emitAsync()
│       - removeAllListeners()
│
├── AnimationEngine.js       # Motor de animaciones
│   └── Clases:
│       - Animation
│       - AnimationEngine
│       - Easing functions
│
└── TimelineEngine.js        # Secuenciador temporal
    └── Clases:
        - Timeline
        - Track
        - Keyframe
        - TimelineEngine
```

### 📁 src/cinematic/managers/

**Propósito**: Coordinadores de alto nivel

```
managers/
├── CinematicManager.js      # Gestor principal de cinemáticas
│   └── Clases:
│       - Cinematic
│       - CinematicManager
│       - getGlobalCinematicManager()
│
├── AudioManager.js          # (Por implementar)
│   └── Control de audio y sincronización
│
├── EffectsManager.js        # (Por implementar)
│   └── Gestión de efectos visuales
│
└── CameraManager.js         # (Por implementar)
    └── Control de cámara cinemática
```

### 📁 src/cinematic/components/

**Propósito**: Componentes React declarativos

```
components/
└── CinematicComponent.js    # Todos los componentes
    ├── <Cinematic>          # Contenedor principal
    ├── <TimelineComponent>  # Timeline visual
    ├── <Keyframe>           # Punto clave
    ├── <SpriteComponent>    # Sprite animado
    ├── <AnimatedValue>      # Valor animado
    ├── <Sequence>           # Secuencia
    ├── <Parallel>           # Paralelo
    ├── <FadeIn>             # Fade in
    ├── <FadeOut>            # Fade out
    ├── <SlideIn>            # Deslizamiento
    ├── <Scale>              # Escalado
    ├── <Rotate>             # Rotación
    └── <CinematicOverlay>   # Overlay
```

### 📁 src/cinematic/hooks/

**Propósito**: React Hooks personalizados

```
hooks/
└── useCinematic.js          # Todos los hooks
    ├── useCinematic()       # Hook principal
    ├── useTimeline()        # Control de timeline
    ├── useSequence()        # Secuencias
    ├── useCinematicEvent()  # Eventos
    ├── useSprite()          # Sprites
    ├── useCinematicCamera() # Cámara
    └── usePreloadAssets()   # Precarga
```

### 📁 src/cinematic/scripts/

**Propósito**: Scripts de ejemplo y templates

```
scripts/
└── ExampleScripts.js        # Scripts de demostración
    ├── introScript          # Introducción simple
    ├── combatCinematic      # Combate complejo
    ├── dialogueCinematic    # Diálogo
    ├── cameraEffectsScript  # Efectos de cámara
    └── tutorialScript       # Tutorial interactivo
```

### 📁 src/cinematic/types/

**Propósito**: Tipos, constantes y enums

```
types/
└── index.js                 # Todas las definiciones
    ├── CinematicState       # Estados
    ├── EasingType           # Tipos de easing
    ├── CinematicEvent       # Eventos
    ├── EffectType           # Efectos
    ├── AnimationDefaults    # Defaults
    ├── TimelineDefaults     # Defaults
    ├── LayerPriority        # Prioridades
    ├── SpriteType           # Tipos de sprite
    ├── PlaybackMode         # Modos de reproducción
    ├── TransitionType       # Transiciones
    └── CameraMode           # Modos de cámara
```

### 📁 examples/

**Propósito**: Ejemplos completos y funcionales

```
examples/
└── SimpleCinematicExample.js    # Ejemplo básico completo
    ├── Scene3D                  # Escena 3D animada
    ├── CinematicControls        # Controles de UI
    └── EventOverlay             # Overlay de eventos
```

## Archivos de Documentación

```
📖 Documentación Principal
├── CINEMATIC_SYSTEM_README.md          # README principal
├── CINEMATIC_SYSTEM_ARCHITECTURE.md    # Arquitectura detallada
├── CINEMATIC_USAGE_EXAMPLES.md         # Ejemplos de uso
├── PERFORMANCE_CONSIDERATIONS.md       # Optimización
├── RECOMMENDED_LIBRARIES.md            # Librerías recomendadas
└── FOLDER_STRUCTURE.md                 # Esta guía
```

## Flujo de Datos

```
┌─────────────────────────────────────────────────┐
│           COMPONENTE REACT                      │
│  <Cinematic> / useCinematic()                   │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│           CINEMATIC MANAGER                     │
│  Orquesta cinemáticas completas                 │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┼────────┐
        ↓        ↓        ↓
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Timeline │ │Animation │ │ Event    │
│ Engine   │ │ Engine   │ │ Bus      │
└──────────┘ └──────────┘ └──────────┘
        │        │        │
        └────────┼────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│        REACT NATIVE / THREE.JS                  │
│     Renderizado final                           │
└─────────────────────────────────────────────────┘
```

## Dependencias entre Módulos

```
CinematicManager
    ├── depends on: TimelineEngine
    ├── depends on: AnimationEngine
    ├── depends on: EventBus
    └── depends on: Types

TimelineEngine
    ├── depends on: EventBus
    └── depends on: Types

AnimationEngine
    └── depends on: Types

Components
    ├── depends on: Hooks
    └── depends on: Types

Hooks
    ├── depends on: Managers
    ├── depends on: Core
    └── depends on: Types
```

## Puntos de Extensión

### 1. Agregar Nuevos Efectos

```
src/cinematic/effects/
└── MyCustomEffect.js

// Implementar interfaz:
class MyCustomEffect {
  constructor(config) { /* ... */ }
  update(deltaTime) { /* ... */ }
  cleanup() { /* ... */ }
}
```

### 2. Agregar Nuevos Hooks

```
src/cinematic/hooks/
└── useMyCustomHook.js

// Exportar desde index.js
export { useMyCustomHook } from './hooks/useMyCustomHook';
```

### 3. Agregar Nuevos Componentes

```
src/cinematic/components/
└── MyCustomComponent.js

// Exportar desde index.js
export { MyCustomComponent } from './components/MyCustomComponent';
```

### 4. Agregar Nuevos Scripts

```
src/cinematic/scripts/
└── MyGameScript.js

// Usar el formato de script:
export const myGameScript = {
  id: 'my_script',
  duration: 10000,
  setup: async (c) => { /* ... */ },
  onStart: async (c) => { /* ... */ }
};
```

## Archivos por Crear (Opcional)

```
src/cinematic/
├── audio/
│   ├── AudioController.js    # Control de audio
│   └── AudioSync.js          # Sincronización con timeline
│
├── effects/
│   ├── Particles.js          # Sistema de partículas
│   ├── Transitions.js        # Transiciones de pantalla
│   └── PostProcessing.js     # Efectos post-procesado
│
├── timeline/
│   ├── TrackTypes.js         # Tipos de pistas
│   ├── Interpolation.js      # Funciones de interpolación
│   └── TimelineEditor.js     # Editor visual (futuro)
│
└── utils/
    ├── Performance.js        # Utilidades de performance
    ├── AssetLoader.js        # Cargador de assets
    └── Debugging.js          # Herramientas de debug
```

## Guía de Navegación Rápida

### Para Empezar:
1. Leer `CINEMATIC_SYSTEM_README.md`
2. Ver `examples/SimpleCinematicExample.js`
3. Revisar `CINEMATIC_USAGE_EXAMPLES.md`

### Para Entender Arquitectura:
1. Leer `CINEMATIC_SYSTEM_ARCHITECTURE.md`
2. Explorar `src/cinematic/core/`
3. Revisar `src/cinematic/managers/`

### Para Optimizar:
1. Leer `PERFORMANCE_CONSIDERATIONS.md`
2. Revisar `src/cinematic/utils/Performance.js`
3. Usar herramientas de profiling

### Para Extender:
1. Seguir estructura de carpetas
2. Implementar interfaces existentes
3. Exportar desde `index.js`

## Comandos Útiles

```bash
# Navegar al sistema
cd src/cinematic

# Ver estructura
tree -L 2

# Buscar en el código
grep -r "useCinematic" src/

# Correr ejemplo
expo start
# Navegar a examples/SimpleCinematicExample.js
```

## Convenciones de Nomenclatura

### Archivos
- **PascalCase**: Componentes y Clases (`CinematicManager.js`)
- **camelCase**: Hooks y utils (`useCinematic.js`)
- **UPPERCASE**: Constantes (`CINEMATIC_EVENTS`)

### Variables
- **camelCase**: Variables y funciones (`currentTime`)
- **PascalCase**: Componentes y Clases (`Timeline`)
- **SCREAMING_SNAKE_CASE**: Constantes (`MAX_DURATION`)

### Prefijos
- `use*`: Hooks de React
- `get*`: Getters
- `set*`: Setters
- `on*`: Event handlers
- `handle*`: Event handlers

## Tamaño del Sistema

```
Total de archivos: ~25
Líneas de código: ~3,500
Tamaño estimado: ~150KB (sin minificar)
Bundle size: ~50KB (minificado + gzip)
```

## Mantenimiento

### Tests
```bash
# Correr tests
npm test

# Coverage
npm run test:coverage
```

### Linting
```bash
# ESLint
npm run lint

# Prettier
npm run format
```

### Build
```bash
# Build producción
npm run build

# Analizar bundle
npm run analyze
```

---

**Sistema diseñado para ser:**
- 📦 Modular
- 🚀 Performante
- 🔧 Extensible
- 📚 Bien documentado
- ✅ Fácil de mantener
