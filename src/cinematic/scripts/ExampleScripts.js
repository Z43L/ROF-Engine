/**
 * EJEMPLO DE SCRIPTS DE CINEMÁTICAS
 * Demostración de cómo crear cinemáticas completas
 */

import { CinematicEvent } from '../types';

/**
 * SCRIPT 1: Cinemática de introducción simple
 */
export const introScript = {
  id: 'intro_cinematic',
  name: 'Game Introduction',
  duration: 10000, // 10 segundos
  skippable: true,

  // Assets necesarios
  assets: {
    backgroundMusic: { type: 'audio', src: 'assets/audio/intro.mp3' },
    logo: { type: 'image', src: 'assets/images/logo.png' },
    titleText: { type: 'text', content: 'Reino Olvidado' }
  },

  // Setup inicial
  setup: async (cinematic) => {
    console.log('Setting up intro cinematic...');
    // Precargar assets
    // Configurar escena inicial
  },

  // Inicio de la cinemática
  onStart: async (cinematic) => {
    console.log('Starting intro cinematic...');

    // Timeline 1: Logo fade in/out
    const logoTimeline = cinematic.timelineEngine.create({
      id: 'logo_timeline',
      duration: 5000,
      autoPlay: true
    });

    // Timeline 2: Título
    const titleTimeline = cinematic.timelineEngine.create({
      id: 'title_timeline',
      duration: 5000,
      autoPlay: false
    });

    // Reproducir título después del logo
    setTimeout(() => {
      titleTimeline.play();
    }, 5000);
  },

  // Actualización cada frame
  onUpdate: (cinematic, deltaTime) => {
    // Actualizar lógica frame por frame si es necesario
  },

  // Finalización
  onComplete: (cinematic) => {
    console.log('Intro cinematic completed!');
    // Transición al menú principal
  }
};

/**
 * SCRIPT 2: Cinemática de combate - Más compleja
 */
export const combatCinematic = {
  id: 'combat_intro',
  name: 'Combat Introduction',
  duration: 15000,
  skippable: true,

  assets: {
    heroModel: { type: 'model', src: 'assets/models/hero.glb' },
    enemyModel: { type: 'model', src: 'assets/models/enemy.glb' },
    combatMusic: { type: 'audio', src: 'assets/audio/combat.mp3' },
    swordSlash: { type: 'audio', src: 'assets/audio/slash.mp3' }
  },

  setup: async (cinematic) => {
    // Configurar modelos 3D
    cinematic.hero = null; // Se asignará cuando se cargue
    cinematic.enemy = null;
    cinematic.camera = null;
  },

  onStart: async (cinematic) => {
    const { hero, enemy, camera } = cinematic;

    // ACTO 1: Zoom a héroe (0-3s)
    const act1Timeline = cinematic.timelineEngine.create({
      id: 'act1',
      duration: 3000,
      tracks: [
        {
          id: 'camera_zoom',
          target: camera?.position,
          property: null,
          keyframes: [
            {
              time: 0,
              values: { x: 0, y: 5, z: 10 }
            },
            {
              time: 3000,
              values: { x: 0, y: 2, z: 5 },
              easing: 'easeInOut'
            }
          ]
        },
        {
          id: 'hero_stance',
          target: hero?.rotation,
          property: null,
          keyframes: [
            {
              time: 0,
              values: { x: 0, y: 0, z: 0 }
            },
            {
              time: 2000,
              values: { x: 0, y: Math.PI / 4, z: 0 },
              easing: 'easeOut',
              onReach: () => {
                console.log('Hero ready!');
                // Reproducir sonido
              }
            }
          ]
        }
      ]
    });

    // ACTO 2: Aparición del enemigo (3-7s)
    setTimeout(() => {
      const act2Timeline = cinematic.timelineEngine.create({
        id: 'act2',
        duration: 4000,
        tracks: [
          {
            id: 'enemy_appear',
            target: enemy?.scale,
            property: null,
            keyframes: [
              { time: 0, values: { x: 0, y: 0, z: 0 } },
              {
                time: 2000,
                values: { x: 1, y: 1, z: 1 },
                easing: 'elastic',
                onReach: () => {
                  console.log('Enemy appeared!');
                  // Efecto de partículas
                }
              }
            ]
          },
          {
            id: 'camera_pan',
            target: camera?.position,
            property: null,
            keyframes: [
              { time: 0, values: { x: 0, y: 2, z: 5 } },
              {
                time: 4000,
                values: { x: 2, y: 3, z: 6 },
                easing: 'easeInOut'
              }
            ]
          }
        ]
      });
    }, 3000);

    // ACTO 3: Confrontación (7-12s)
    setTimeout(() => {
      const act3Timeline = cinematic.timelineEngine.create({
        id: 'act3',
        duration: 5000,
        tracks: [
          {
            id: 'hero_attack',
            target: hero?.position,
            property: null,
            keyframes: [
              { time: 0, values: { x: 0, y: 0, z: 0 } },
              {
                time: 1000,
                values: { x: 0, y: 0.5, z: -1 },
                easing: 'easeIn',
                onReach: () => {
                  // Efecto de slash
                  console.log('Attack!');
                }
              },
              {
                time: 2000,
                values: { x: 0, y: 0, z: 0 },
                easing: 'bounce'
              }
            ]
          }
        ]
      });

      // Emitir evento personalizado
      cinematic.eventBus.emit(CinematicEvent.CUSTOM, {
        type: 'combat_start',
        hero,
        enemy
      });
    }, 7000);

    // ACTO 4: Final (12-15s)
    setTimeout(() => {
      const act4Timeline = cinematic.timelineEngine.create({
        id: 'act4',
        duration: 3000,
        tracks: [
          {
            id: 'camera_pullback',
            target: camera?.position,
            property: null,
            keyframes: [
              { time: 0, values: { x: 2, y: 3, z: 6 } },
              {
                time: 3000,
                values: { x: 0, y: 5, z: 10 },
                easing: 'easeOut'
              }
            ]
          }
        ],
        onComplete: () => {
          cinematic.complete();
        }
      });
    }, 12000);
  },

  onComplete: (cinematic) => {
    console.log('Combat cinematic completed!');
    // Iniciar combate real
  }
};

/**
 * SCRIPT 3: Cinemática de diálogo
 */
export const dialogueCinematic = {
  id: 'dialogue_scene',
  name: 'Character Dialogue',
  duration: 20000,
  skippable: true,

  dialogue: [
    {
      time: 0,
      character: 'Hero',
      text: 'What is this place?',
      duration: 3000,
      voice: 'assets/audio/hero_line1.mp3'
    },
    {
      time: 3500,
      character: 'Mentor',
      text: 'This is the Forgotten Kingdom...',
      duration: 4000,
      voice: 'assets/audio/mentor_line1.mp3'
    },
    {
      time: 8000,
      character: 'Hero',
      text: 'I must find the ancient artifact!',
      duration: 3500,
      voice: 'assets/audio/hero_line2.mp3'
    },
    {
      time: 12000,
      character: 'Mentor',
      text: 'Then your journey begins...',
      duration: 4000,
      voice: 'assets/audio/mentor_line2.mp3'
    }
  ],

  onStart: async (cinematic) => {
    // Timeline para cada línea de diálogo
    cinematic.dialogue.forEach((line, index) => {
      setTimeout(() => {
        // Mostrar texto
        cinematic.eventBus.emit(CinematicEvent.CUSTOM, {
          type: 'show_dialogue',
          character: line.character,
          text: line.text
        });

        // Animar cámara al personaje
        const cameraTimeline = cinematic.timelineEngine.create({
          id: `dialogue_${index}`,
          duration: line.duration,
          autoPlay: true
        });

        // Reproducir audio
        if (line.voice) {
          // Reproducir voz
        }

        // Ocultar texto después de la duración
        setTimeout(() => {
          cinematic.eventBus.emit(CinematicEvent.CUSTOM, {
            type: 'hide_dialogue'
          });
        }, line.duration);
      }, line.time);
    });
  },

  onComplete: (cinematic) => {
    console.log('Dialogue completed!');
  }
};

/**
 * SCRIPT 4: Cinemática con efectos de cámara
 */
export const cameraEffectsScript = {
  id: 'camera_showcase',
  name: 'Camera Effects Demo',
  duration: 12000,
  skippable: true,

  onStart: async (cinematic) => {
    const { camera } = cinematic;

    // Efecto 1: Camera shake (0-2s)
    const shakeTimeline = cinematic.timelineEngine.create({
      id: 'shake',
      duration: 2000,
      tracks: [
        {
          id: 'shake_x',
          target: camera?.position,
          property: 'x',
          keyframes: Array.from({ length: 20 }, (_, i) => ({
            time: i * 100,
            values: (Math.random() - 0.5) * 0.2,
            easing: 'linear'
          }))
        }
      ]
    });

    // Efecto 2: Slow zoom (2-6s)
    setTimeout(() => {
      const zoomTimeline = cinematic.timelineEngine.create({
        id: 'zoom',
        duration: 4000,
        tracks: [
          {
            id: 'zoom_in',
            target: camera?.position,
            property: null,
            keyframes: [
              { time: 0, values: { x: 0, y: 5, z: 10 } },
              {
                time: 4000,
                values: { x: 0, y: 2, z: 3 },
                easing: 'easeInOut'
              }
            ]
          }
        ]
      });
    }, 2000);

    // Efecto 3: Orbit (6-12s)
    setTimeout(() => {
      const orbitTimeline = cinematic.timelineEngine.create({
        id: 'orbit',
        duration: 6000,
        tracks: [
          {
            id: 'orbit_path',
            target: camera?.position,
            property: null,
            keyframes: Array.from({ length: 60 }, (_, i) => {
              const angle = (i / 60) * Math.PI * 2;
              const radius = 5;
              return {
                time: i * 100,
                values: {
                  x: Math.cos(angle) * radius,
                  y: 3,
                  z: Math.sin(angle) * radius
                },
                easing: 'linear'
              };
            })
          }
        ],
        onComplete: () => {
          cinematic.complete();
        }
      });
    }, 6000);
  }
};

/**
 * SCRIPT 5: Tutorial interactivo
 */
export const tutorialScript = {
  id: 'tutorial',
  name: 'Game Tutorial',
  duration: 30000,
  skippable: false, // Los tutoriales no se pueden saltar

  steps: [
    {
      time: 0,
      instruction: 'Move using the joystick',
      highlight: 'joystick',
      waitForAction: true,
      action: 'move'
    },
    {
      time: 5000,
      instruction: 'Press attack button to attack',
      highlight: 'attack_button',
      waitForAction: true,
      action: 'attack'
    },
    {
      time: 10000,
      instruction: 'Collect the treasure chest',
      highlight: 'treasure',
      waitForAction: true,
      action: 'collect'
    }
  ],

  currentStep: 0,

  onStart: async (cinematic) => {
    cinematic.showStep(0);
  },

  showStep: function(stepIndex) {
    const step = this.steps[stepIndex];
    if (!step) return;

    // Mostrar instrucción
    console.log(`Step ${stepIndex + 1}: ${step.instruction}`);

    // Highlight del elemento
    this.eventBus.emit(CinematicEvent.CUSTOM, {
      type: 'highlight_element',
      element: step.highlight
    });

    // Si espera acción del usuario
    if (step.waitForAction) {
      this.waitForUserAction(step.action, () => {
        this.currentStep++;
        if (this.currentStep < this.steps.length) {
          this.showStep(this.currentStep);
        } else {
          this.complete();
        }
      });
    }
  },

  waitForUserAction: function(action, callback) {
    const listener = this.eventBus.on(`user:${action}`, () => {
      listener(); // Desuscribirse
      callback();
    });
  }
};

/**
 * Exportar todos los scripts
 */
export default {
  introScript,
  combatCinematic,
  dialogueCinematic,
  cameraEffectsScript,
  tutorialScript
};
