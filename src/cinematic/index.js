/**
 * CINEMATIC SYSTEM - Punto de entrada principal
 * Sistema completo de animaciones y cinemáticas para React Native
 */

// Core
export { default as AnimationEngine, Animation, Easing } from './core/AnimationEngine';
export {
  default as TimelineEngine,
  Timeline,
  Track,
  Keyframe
} from './core/TimelineEngine';
export { default as EventBus, getGlobalEventBus } from './core/EventBus';

// Managers
export {
  default as CinematicManager,
  Cinematic,
  getGlobalCinematicManager
} from './managers/CinematicManager';

// Components
export {
  Cinematic as CinematicComponent,
  TimelineComponent,
  Keyframe as KeyframeComponent,
  SpriteComponent,
  AnimatedValue,
  Sequence,
  Parallel,
  FadeIn,
  FadeOut,
  SlideIn,
  Scale,
  Rotate,
  CinematicOverlay
} from './components/CinematicComponent';

// Hooks
export {
  useCinematic,
  useTimeline,
  useSequence,
  useCinematicEvent,
  useSprite,
  useCinematicCamera,
  usePreloadAssets
} from './hooks/useCinematic';

// Types
export {
  CinematicState,
  EasingType,
  CinematicEvent,
  EffectType,
  AnimationDefaults,
  TimelineDefaults,
  LayerPriority,
  SpriteType,
  PlaybackMode,
  TransitionType,
  CameraMode
} from './types';

// Scripts de ejemplo
export {
  introScript,
  combatCinematic,
  dialogueCinematic,
  cameraEffectsScript,
  tutorialScript
} from './scripts/ExampleScripts';

/**
 * API de conveniencia para crear cinemáticas rápidamente
 */

import { getGlobalCinematicManager } from './managers/CinematicManager';

/**
 * Crear y reproducir una cinemática simple
 * @param {Object} config - Configuración de la cinemática
 * @returns {Promise<Cinematic>}
 */
export async function playCinematic(config) {
  const manager = getGlobalCinematicManager();
  const cinematic = manager.register(config);
  await manager.play(cinematic.id);
  return cinematic;
}

/**
 * Detener cinemática actual
 */
export function stopCurrentCinematic() {
  const manager = getGlobalCinematicManager();
  manager.stop();
}

/**
 * Pausar cinemática actual
 */
export function pauseCurrentCinematic() {
  const manager = getGlobalCinematicManager();
  manager.pause();
}

/**
 * Reanudar cinemática actual
 */
export function resumeCurrentCinematic() {
  const manager = getGlobalCinematicManager();
  manager.resume();
}

/**
 * Saltar cinemática actual
 */
export function skipCurrentCinematic() {
  const manager = getGlobalCinematicManager();
  manager.skip();
}

/**
 * Obtener estado del sistema de cinemáticas
 */
export function getCinematicSystemState() {
  const manager = getGlobalCinematicManager();
  return manager.getState();
}

/**
 * Helper para crear secuencias de animaciones
 */
export function createSequence(...animations) {
  return animations.map((anim, index) => ({
    ...anim,
    delay: animations.slice(0, index).reduce((acc, a) => acc + (a.duration || 0), 0)
  }));
}

/**
 * Helper para crear animaciones paralelas
 */
export function createParallel(...animations) {
  return animations.map(anim => ({
    ...anim,
    delay: 0
  }));
}

/**
 * Default export con todas las utilidades
 */
export default {
  // API principal
  playCinematic,
  stopCurrentCinematic,
  pauseCurrentCinematic,
  resumeCurrentCinematic,
  skipCurrentCinematic,
  getCinematicSystemState,

  // Helpers
  createSequence,
  createParallel,

  // Managers
  getGlobalCinematicManager,
  getGlobalEventBus
};
