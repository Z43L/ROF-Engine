# Guía Visual - Sistema de Cinemáticas

## 📐 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                         │
│                  (React Components & UI)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Cinematic │  │Timeline  │  │  Sprite  │  │ Effects  │       │
│  │Component │  │Component │  │Component │  │Components│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE COORDINACIÓN                         │
│                    (Hooks & Managers)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  use     │  │   use    │  │   use    │  │Cinematic │       │
│  │Cinematic │  │ Timeline │  │  Sprite  │  │ Manager  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE LÓGICA                             │
│                    (Core Systems)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Animation │  │ Timeline │  │  Event   │  │  Script  │       │
│  │  Engine  │  │  Engine  │  │   Bus    │  │  Runner  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE RENDERIZADO                          │
│         (React Native Reanimated + Three.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Worklets │  │  Shared  │  │ Three.js │  │ React    │       │
│  │          │  │  Values  │  │ Renderer │  │ Native   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Ejecución de Cinemática

```
   Usuario
      │
      ├─ Presiona Play
      │
      ↓
┌──────────────┐
│  Component   │
│   (React)    │
└──────┬───────┘
       │ useCinematic()
       ↓
┌──────────────┐
│   Hook       │
│ useCinematic │
└──────┬───────┘
       │ play()
       ↓
┌──────────────────┐
│ CinematicManager │
│  play(id)        │
└──────┬───────────┘
       │
       ├─ load assets
       ├─ setup script
       ├─ emit START event
       │
       ↓
┌───────────────────┐
│   Cinematic       │
│   Instance        │
└────────┬──────────┘
         │
         ├─ TimelineEngine.update()
         ├─ AnimationEngine.update()
         ├─ EventBus.emit()
         │
         ↓
┌─────────────────┐
│  Renderizado    │
│  (60 FPS)       │
└─────────────────┘
```

## 🎬 Anatomía de una Cinemática

```
┌──────────────────────────────────────────────────────────┐
│                     CINEMATIC                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ID: "boss_intro"                                   │  │
│  │ Duration: 15000ms                                  │  │
│  │ State: PLAYING                                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              SCRIPT                              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │    │
│  │  │  setup   │→ │ onStart  │→ │onComplete│      │    │
│  │  └──────────┘  └──────────┘  └──────────┘      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              TIMELINES                           │    │
│  │  ┌────────────────────┐                         │    │
│  │  │ Timeline 1 (Hero)  │  [====>        ] 40%   │    │
│  │  │  - Track 1: pos    │                         │    │
│  │  │  - Track 2: rot    │                         │    │
│  │  └────────────────────┘                         │    │
│  │                                                  │    │
│  │  ┌────────────────────┐                         │    │
│  │  │ Timeline 2 (Enemy) │  [=========>   ] 60%   │    │
│  │  │  - Track 1: scale  │                         │    │
│  │  └────────────────────┘                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              ANIMATIONS                          │    │
│  │  [Animation 1] [Animation 2] [Animation 3]      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              EVENTS                              │    │
│  │  START → KEYFRAME_REACHED → COMPLETE           │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## 📊 Timeline con Tracks y Keyframes

```
Timeline: "hero_movement" (Duration: 5000ms)
│
├── Track 1: position.x
│   │
│   │     Keyframe 1          Keyframe 2          Keyframe 3
│   │         │                   │                   │
│   │         ↓                   ↓                   ↓
│   │    time: 0              time: 2500          time: 5000
│   │    value: 0             value: 100          value: 200
│   │    easing: linear       easing: easeOut     easing: bounce
│   │         │                   │                   │
│   ├─────────┴───────────────────┴───────────────────┴──────→ time
│   0ms                     2500ms                    5000ms
│   │
│   │ Interpolación:
│   │ ┌────┐        ┌────────┐              ┌────────┐
│   │ │    │────────│        │──────────────│        │
│   │ └────┘        └────────┘              └────────┘
│
├── Track 2: position.y
│   │
│   │     Keyframe 1          Keyframe 2          Keyframe 3
│   │         │                   │                   │
│   │         ↓                   ↓                   ↓
│   │    time: 0              time: 1000          time: 5000
│   │    value: 0             value: 50           value: 0
│   │    easing: easeIn       easing: easeOut     easing: linear
│   │         │                   │                   │
│   ├─────────┴───────────────────┴───────────────────┴──────→ time
│   0ms                     1000ms                    5000ms
│
└── Track 3: rotation
    │
    │     Keyframe 1          Keyframe 2
    │         │                   │
    │         ↓                   ↓
    │    time: 0              time: 3000
    │    value: 0             value: Math.PI
    │    easing: linear       easing: spring
    │         │                   │
    ├─────────┴───────────────────┴────────────────────────→ time
    0ms                     3000ms                    5000ms
```

## 🎯 Sistema de Eventos

```
                     ┌───────────────┐
                     │   EventBus    │
                     │   (Singleton) │
                     └───────┬───────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ↓                   ↓                   ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Listener 1    │  │   Listener 2    │  │   Listener 3    │
│  (Component A)  │  │  (Component B)  │  │    (Manager)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Ejemplo de flujo:

1. Component A: eventBus.emit('boss_appear', { bossId: 'dragon' })
                     │
                     ↓
2. EventBus distribución:
                     │
         ┌───────────┼───────────┐
         ↓           ↓           ↓
3. Listener 1    Listener 2    Listener 3
   ejecuta       ejecuta        ejecuta
   callback      callback       callback
```

## 🔄 Estados de Cinemática

```
    ┌─────────────────────────────────────────────────┐
    │                   LIFECYCLE                      │
    └─────────────────────────────────────────────────┘

         ╔═══════╗
         ║  IDLE ║  ← Estado inicial
         ╚═══╤═══╝
             │ load()
             ↓
       ╔═════════╗
       ║ LOADING ║  ← Cargando assets
       ╚═════╤═══╝
             │ assets loaded
             ↓
       ╔═════════╗
       ║  READY  ║  ← Listo para reproducir
       ╚═════╤═══╝
             │ play()
             ↓
       ╔═════════╗
    ┌─╢ PLAYING ╟─┐  ← Reproduciéndose
    │  ╚═════╤═══╝  │
    │        │      │
    │ pause()│      │ complete()
    │        ↓      │
    │  ╔═════════╗  │
    └→ ║ PAUSED  ║  │
       ╚═════╤═══╝  │
             │      │
       resume()     │
             │      │
             └──────┘
                    ↓
              ╔═══════════╗
              ║ COMPLETED ║  ← Finalizado
              ╚═══════════╝

    Error en cualquier momento:
              ╔═══════╗
              ║ ERROR ║
              ╚═══════╝
```

## 📦 Estructura de Módulos

```
src/cinematic/
│
├── core/                    ┌─────────────────┐
│   ├── EventBus.js ───────→│   Comunicación  │
│   ├── AnimationEngine.js ─→│   Animaciones   │
│   └── TimelineEngine.js ──→│   Secuencias    │
│                            └─────────────────┘
│                                     ↑
├── managers/                         │
│   └── CinematicManager.js ─────────┘
│                                     ↑
├── hooks/                            │
│   └── useCinematic.js ──────────────┘
│                                     ↑
├── components/                       │
│   └── CinematicComponent.js ────────┘
│                                     ↑
└── index.js ───────────────────────┐ │
                                    │ │
                                    ↓ ↓
                               ┌──────────┐
                               │ Tu App   │
                               └──────────┘
```

## 🎮 Ejemplo de Uso Visual

```
                    Tu Componente React
                         │
                         │ import { useCinematic }
                         │
                         ↓
              ┌─────────────────────────┐
              │  useCinematic({         │
              │    id: 'intro',         │
              │    duration: 5000,      │
              │    script: { ... }      │
              │  })                     │
              └────────┬────────────────┘
                       │
                       │ retorna:
                       │
              ┌────────┴────────────────┐
              │ {                       │
              │   state,     ──────┐    │
              │   progress,  ──────┼───→│ UI Updates
              │   play(),    ──────┤    │
              │   pause(),   ──────┘    │
              │   stop(),               │
              │   skip()                │
              │ }                       │
              └─────────────────────────┘
                       │
                       │ play() ejecuta:
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ↓                           ↓
   ┌───────────┐              ┌───────────┐
   │ Timeline  │              │ Animation │
   │ Engine    │              │ Engine    │
   └─────┬─────┘              └─────┬─────┘
         │                          │
         └──────────┬───────────────┘
                    │
                    ↓
             ┌─────────────┐
             │ Renderizado │
             │  (60 FPS)   │
             └─────────────┘
```

## 🎬 Ejemplo Completo Visual

```
╔═══════════════════════════════════════════════════════════════╗
║              BOSS INTRO CINEMATIC (15 segundos)               ║
╚═══════════════════════════════════════════════════════════════╝

Tiempo: 0s ────────────────────────────────────────→ 15s
        │                                             │
        │    FASE 1      FASE 2      FASE 3    FASE 4│
        │   (0-2s)      (2-7s)      (7-10s)  (10-15s)│
        │                                             │
        ├──────────┬───────────┬──────────┬──────────┤
        │          │           │          │          │
        ↓          ↓           ↓          ↓          ↓

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Fade to  │→│  Spawn   │→│   Boss   │→│   Show   │→│  Fade    │
│  Black   │ │   Boss   │ │   Roar   │ │   Name   │ │   Out    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
     │            │            │            │            │
     ↓            ↓            ↓            ↓            ↓
  Timeline     Timeline     Timeline     Timeline     Timeline
  (2000ms)     (5000ms)     (3000ms)     (3000ms)     (2000ms)
     │            │            │            │            │
     └────────────┴────────────┴────────────┴────────────┘
                            │
                            ↓
                     ┌─────────────┐
                     │   EVENTOS   │
                     │  emit(...)  │
                     └─────────────┘
                            │
                            ↓
                     ┌─────────────┐
                     │ UI Updates  │
                     │ Messages    │
                     └─────────────┘
```

## 🔧 Componentes Declarativos

```
    <Cinematic>
         │
         ├─ <Sequence>
         │      │
         │      ├─ <FadeIn>
         │      │     └─ <Image />
         │      │
         │      ├─ <SlideIn>
         │      │     └─ <Text />
         │      │
         │      └─ <Scale>
         │            └─ <Button />
         │
         └─ CinematicControls
                ├─ Progress Bar
                └─ Play/Pause/Stop

Renderizado:

┌──────────────────────────────────────┐
│ ╔══════════════════════════════════╗ │
│ ║  [Logo aparece con fade]         ║ │
│ ║                                  ║ │
│ ║      [Título desliza]            ║ │
│ ║                                  ║ │
│ ║         [Botón escala]           ║ │
│ ╚══════════════════════════════════╝ │
│                                      │
│ [▶][⏸][⏹]  ████████░░░░░░░ 60%      │
└──────────────────────────────────────┘
```

## 📈 Performance Monitor

```
┌─────────────────────────────────────────┐
│       PERFORMANCE DASHBOARD             │
├─────────────────────────────────────────┤
│                                         │
│ FPS:  ████████████████████████ 60      │
│                                         │
│ Frame Time:  ██████░░░░░░░░░  12ms     │
│                                         │
│ Memory:      ████████░░░░░░░  150MB    │
│                                         │
│ Timelines:   3 active                  │
│ Animations:  12 running                │
│ Events/sec:  45                        │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ CPU Usage (last 60 frames)      │   │
│ │ ▁▂▃▂▄▅▆▅▄▃▂▁▂▃▄▅▆▇▆▅▄▃▂▁        │   │
│ └─────────────────────────────────┘   │
│                                         │
│ Status: ✅ OPTIMAL                      │
└─────────────────────────────────────────┘
```

## 🎯 Integración con GameEngine

```
┌──────────────────────────────────────────────────┐
│              GAME ENGINE                         │
│  ┌────────────────────────────────────────────┐  │
│  │ Entity System                              │  │
│  │  - Player                                  │  │
│  │  - Enemies                                 │  │
│  │  - Items                                   │  │
│  └───────────────┬────────────────────────────┘  │
│                  │                                │
│  ┌───────────────┴────────────────────────────┐  │
│  │ Systems                                    │  │
│  │  - PhysicsSystem                           │  │
│  │  - RenderSystem                            │  │
│  │  - InputSystem                             │  │
│  │  - CinematicSystem  ← INTEGRACIÓN          │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
│  useFrame((state, delta) => {                    │
│    gameEngine.update(delta);                     │
│    cinematicManager.update(delta);  ← SYNC      │
│  });                                             │
└──────────────────────────────────────────────────┘
```

## 🌐 Flujo de Datos Completo

```
       User Input
           │
           ↓
     [Play Button]
           │
           ↓
    ┌──────────────┐
    │  Component   │
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │  useCinematic│
    │    Hook      │
    └──────┬───────┘
           │
           ↓
    ┌──────────────────┐
    │CinematicManager  │
    │  ┌────────────┐  │
    │  │ Cinematic  │  │
    │  └─────┬──────┘  │
    └────────┼─────────┘
             │
        ┌────┴────┐
        │         │
        ↓         ↓
┌───────────┐ ┌───────────┐
│ Timeline  │ │Animation  │
│  Engine   │ │  Engine   │
└─────┬─────┘ └─────┬─────┘
      │             │
      └──────┬──────┘
             │
             ↓
      ┌────────────┐
      │  EventBus  │
      └─────┬──────┘
            │
        ┌───┴────┐
        │        │
        ↓        ↓
  ┌─────────┐ ┌─────────┐
  │Component│ │Component│
  │    A    │ │    B    │
  └─────────┘ └─────────┘
        │        │
        └────┬───┘
             │
             ↓
       [UI Update]
```

---

**Nota**: Estos diagramas son representaciones visuales para ayudar a entender la arquitectura. El código real está en `src/cinematic/`.

Para más detalles técnicos, consulta:
- [CINEMATIC_SYSTEM_ARCHITECTURE.md](CINEMATIC_SYSTEM_ARCHITECTURE.md)
- [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md)
