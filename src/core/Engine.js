/**
 * Engine
 * Motor principal del juego
 * Coordina el game loop, world, sistemas y tiempo
 */

import World from './World.js';
import EventEmitter from '../utils/EventEmitter.js';
import { PoolManager } from '../utils/Pool.js';

class Engine extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      targetFPS: 60,
      maxDeltaTime: 0.1, // Máximo delta time para evitar spiral of death
      timeScale: 1.0,
      autoStart: false,
      ...config
    };

    this.world = new World();
    this.poolManager = new PoolManager();

    this.running = false;
    this.paused = false;
    this.time = 0;
    this.deltaTime = 0;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateTime = 0;
    this.fpsFrameCount = 0;

    this.rafId = null;

    // Bind del update para requestAnimationFrame
    this._update = this._update.bind(this);

    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * Inicia el motor
   */
  start() {
    if (this.running) {
      console.warn('Engine is already running');
      return;
    }

    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();

    this.emit('start');
    this._update();
  }

  /**
   * Detiene el motor
   */
  stop() {
    if (!this.running) return;

    this.running = false;
    this.paused = false;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.emit('stop');
  }

  /**
   * Pausa el motor
   */
  pause() {
    if (!this.running || this.paused) return;

    this.paused = true;
    this.emit('pause');
  }

  /**
   * Reanuda el motor
   */
  resume() {
    if (!this.running || !this.paused) return;

    this.paused = false;
    this.lastTime = performance.now();
    this.emit('resume');
  }

  /**
   * Game loop principal
   */
  _update() {
    if (!this.running) return;

    // Programar siguiente frame
    this.rafId = requestAnimationFrame(this._update);

    if (this.paused) return;

    // Calcular delta time
    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / 1000; // Convertir a segundos
    this.lastTime = currentTime;

    // Limitar delta time para evitar grandes saltos
    deltaTime = Math.min(deltaTime, this.config.maxDeltaTime);

    // Aplicar time scale
    deltaTime *= this.config.timeScale;

    this.deltaTime = deltaTime;
    this.time += deltaTime;
    this.frameCount++;

    // Calcular FPS
    this.fpsFrameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.fpsFrameCount;
      this.fpsFrameCount = 0;
      this.fpsUpdateTime = currentTime;
      this.emit('fpsUpdate', this.fps);
    }

    // Actualizar world y sistemas
    this.emit('beforeUpdate', deltaTime);
    this.world.update(deltaTime);
    this.emit('afterUpdate', deltaTime);
  }

  /**
   * Ejecuta un solo step (útil para debugging)
   */
  step(deltaTime = 1 / 60) {
    if (!this.paused) return;

    this.world.update(deltaTime);
    this.time += deltaTime;
    this.frameCount++;
  }

  /**
   * Crea una entidad
   */
  createEntity() {
    return this.world.createEntity();
  }

  /**
   * Obtiene una entidad
   */
  getEntity(id) {
    return this.world.getEntity(id);
  }

  /**
   * Elimina una entidad
   */
  removeEntity(entity) {
    this.world.removeEntity(entity);
  }

  /**
   * Registra un sistema
   */
  registerSystem(system) {
    this.world.registerSystem(system);
    return system;
  }

  /**
   * Elimina un sistema
   */
  unregisterSystem(system) {
    this.world.unregisterSystem(system);
  }

  /**
   * Obtiene un sistema por nombre
   */
  getSystem(name) {
    return this.world.getSystem(name);
  }

  /**
   * Establece el time scale
   */
  setTimeScale(scale) {
    this.config.timeScale = Math.max(0, scale);
    this.emit('timeScaleChanged', this.config.timeScale);
  }

  /**
   * Obtiene estadísticas del engine
   */
  get stats() {
    return {
      running: this.running,
      paused: this.paused,
      time: this.time,
      deltaTime: this.deltaTime,
      fps: this.fps,
      frameCount: this.frameCount,
      timeScale: this.config.timeScale,
      world: this.world.stats,
      pools: this.poolManager.stats
    };
  }

  /**
   * Resetea el engine
   */
  reset() {
    const wasRunning = this.running;

    this.stop();
    this.world.clear();
    this.poolManager.releaseAll();

    this.time = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateTime = 0;
    this.fpsFrameCount = 0;

    this.emit('reset');

    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Limpia y destruye el engine
   */
  destroy() {
    this.stop();
    this.world.destroy();
    this.poolManager.clear();
    this.removeAllListeners();
    this.emit('destroy');
  }
}

export default Engine;
