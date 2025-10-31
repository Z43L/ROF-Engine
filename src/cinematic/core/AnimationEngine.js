/**
 * ANIMATION ENGINE - Motor principal de animaciones
 * Maneja interpolación, easing y control de animaciones
 */

import { EasingType, AnimationDefaults } from '../types';

// Funciones de easing
export const Easing = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

  // Spring (simplificado)
  spring: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : -Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  // Bounce
  bounce: t => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },

  // Elastic
  elastic: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },

  // Bezier personalizado
  bezier: (p0, p1, p2, p3) => {
    return t => {
      const u = 1 - t;
      return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    };
  }
};

/**
 * Clase Animation - Representa una animación individual
 */
export class Animation {
  constructor(config = {}) {
    this.id = config.id || `anim_${Date.now()}_${Math.random()}`;
    this.target = config.target;
    this.properties = config.properties || {};
    this.duration = config.duration || AnimationDefaults.duration;
    this.easing = config.easing || AnimationDefaults.easing;
    this.delay = config.delay || 0;
    this.loop = config.loop || false;
    this.yoyo = config.yoyo || false;

    this.startTime = null;
    this.pausedTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.isCompleted = false;
    this.direction = 1; // 1 = forward, -1 = reverse

    this.startValues = {};
    this.endValues = {};

    this.onStart = config.onStart;
    this.onUpdate = config.onUpdate;
    this.onComplete = config.onComplete;
    this.onLoop = config.onLoop;
  }

  /**
   * Iniciar la animación
   */
  start(currentTime) {
    if (this.isPlaying) return;

    this.startTime = currentTime + this.delay;
    this.isPlaying = true;
    this.isPaused = false;
    this.isCompleted = false;

    // Capturar valores iniciales
    this._captureStartValues();

    if (this.onStart) {
      this.onStart(this);
    }
  }

  /**
   * Pausar la animación
   */
  pause(currentTime) {
    if (!this.isPlaying || this.isPaused) return;
    this.pausedTime = currentTime;
    this.isPaused = true;
  }

  /**
   * Reanudar la animación
   */
  resume(currentTime) {
    if (!this.isPaused) return;
    const pauseDuration = currentTime - this.pausedTime;
    this.startTime += pauseDuration;
    this.isPaused = false;
  }

  /**
   * Detener la animación
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.isCompleted = true;
  }

  /**
   * Actualizar la animación
   */
  update(currentTime) {
    if (!this.isPlaying || this.isPaused || !this.target) return false;

    // Esperar el delay
    if (currentTime < this.startTime) return false;

    // Calcular progreso
    const elapsed = currentTime - this.startTime;
    let progress = Math.min(elapsed / this.duration, 1);

    // Aplicar dirección (para yoyo)
    if (this.direction === -1) {
      progress = 1 - progress;
    }

    // Aplicar easing
    const easedProgress = this._applyEasing(progress);

    // Interpolar valores
    this._interpolateValues(easedProgress);

    // Callback de update
    if (this.onUpdate) {
      this.onUpdate(this, easedProgress);
    }

    // Verificar si completó
    if (progress >= 1) {
      return this._handleComplete();
    }

    return false;
  }

  /**
   * Capturar valores iniciales del target
   */
  _captureStartValues() {
    Object.keys(this.properties).forEach(key => {
      if (this.target && this.target[key] !== undefined) {
        this.startValues[key] = this.target[key];
        this.endValues[key] = this.properties[key];
      }
    });
  }

  /**
   * Aplicar función de easing
   */
  _applyEasing(t) {
    const easingFunc = typeof this.easing === 'function'
      ? this.easing
      : Easing[this.easing] || Easing.linear;

    return easingFunc(t);
  }

  /**
   * Interpolar valores entre start y end
   */
  _interpolateValues(progress) {
    Object.keys(this.startValues).forEach(key => {
      const start = this.startValues[key];
      const end = this.endValues[key];

      if (typeof start === 'number' && typeof end === 'number') {
        this.target[key] = start + (end - start) * progress;
      } else if (typeof start === 'object' && start !== null) {
        // Interpolar objetos (ej: {x, y, z})
        this._interpolateObject(this.target[key], start, end, progress);
      }
    });
  }

  /**
   * Interpolar propiedades de objetos
   */
  _interpolateObject(target, start, end, progress) {
    Object.keys(start).forEach(key => {
      if (typeof start[key] === 'number' && typeof end[key] === 'number') {
        target[key] = start[key] + (end[key] - start[key]) * progress;
      }
    });
  }

  /**
   * Manejar completación de la animación
   */
  _handleComplete() {
    if (this.yoyo) {
      // Invertir dirección
      this.direction *= -1;
      this.startTime = performance.now();

      // Intercambiar start y end values
      [this.startValues, this.endValues] = [this.endValues, this.startValues];

      if (this.onLoop) {
        this.onLoop(this);
      }

      return false;
    }

    if (this.loop) {
      // Reiniciar animación
      this.startTime = performance.now();

      if (this.onLoop) {
        this.onLoop(this);
      }

      return false;
    }

    // Animación completada
    this.isCompleted = true;
    this.isPlaying = false;

    if (this.onComplete) {
      this.onComplete(this);
    }

    return true;
  }
}

/**
 * AnimationEngine - Gestor de múltiples animaciones
 */
export class AnimationEngine {
  constructor() {
    this.animations = new Map();
    this.groups = new Map();
    this.isRunning = false;
    this.currentTime = 0;
  }

  /**
   * Agregar una animación
   */
  add(animation) {
    this.animations.set(animation.id, animation);
    return animation;
  }

  /**
   * Remover una animación
   */
  remove(animationId) {
    this.animations.delete(animationId);
  }

  /**
   * Crear y agregar una animación
   */
  animate(target, properties, config = {}) {
    const animation = new Animation({
      target,
      properties,
      ...config
    });

    this.add(animation);
    animation.start(this.currentTime);

    return animation;
  }

  /**
   * Crear un grupo de animaciones
   */
  group(name, animations = []) {
    this.groups.set(name, animations);
    return {
      play: () => this.playGroup(name),
      pause: () => this.pauseGroup(name),
      stop: () => this.stopGroup(name)
    };
  }

  /**
   * Reproducir un grupo
   */
  playGroup(name) {
    const animations = this.groups.get(name);
    if (!animations) return;

    animations.forEach(anim => {
      if (!anim.isPlaying) {
        anim.start(this.currentTime);
      }
    });
  }

  /**
   * Pausar un grupo
   */
  pauseGroup(name) {
    const animations = this.groups.get(name);
    if (!animations) return;

    animations.forEach(anim => anim.pause(this.currentTime));
  }

  /**
   * Detener un grupo
   */
  stopGroup(name) {
    const animations = this.groups.get(name);
    if (!animations) return;

    animations.forEach(anim => anim.stop());
  }

  /**
   * Actualizar todas las animaciones
   */
  update(deltaTime) {
    this.currentTime += deltaTime * 1000; // convertir a ms

    const completedAnimations = [];

    this.animations.forEach(animation => {
      const completed = animation.update(this.currentTime);
      if (completed) {
        completedAnimations.push(animation.id);
      }
    });

    // Limpiar animaciones completadas
    completedAnimations.forEach(id => this.remove(id));
  }

  /**
   * Pausar todas las animaciones
   */
  pauseAll() {
    this.animations.forEach(anim => anim.pause(this.currentTime));
  }

  /**
   * Reanudar todas las animaciones
   */
  resumeAll() {
    this.animations.forEach(anim => anim.resume(this.currentTime));
  }

  /**
   * Detener todas las animaciones
   */
  stopAll() {
    this.animations.forEach(anim => anim.stop());
    this.animations.clear();
  }

  /**
   * Limpiar el engine
   */
  clear() {
    this.stopAll();
    this.groups.clear();
    this.currentTime = 0;
  }
}

export default AnimationEngine;
