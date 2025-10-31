/**
 * CINEMATIC MANAGER - Orquestador de cinemáticas completas
 * Coordina timelines, audio, efectos y cámara
 */

import { CinematicState, CinematicEvent } from '../types';
import { getGlobalEventBus } from '../core/EventBus';
import { TimelineEngine } from '../core/TimelineEngine';
import { AnimationEngine } from '../core/AnimationEngine';

/**
 * Clase Cinematic - Representa una cinemática completa
 */
export class Cinematic {
  constructor(config) {
    this.id = config.id || `cinematic_${Date.now()}`;
    this.name = config.name || this.id;
    this.state = CinematicState.IDLE;

    // Engines
    this.timelineEngine = new TimelineEngine();
    this.animationEngine = new AnimationEngine();
    this.eventBus = config.eventBus || getGlobalEventBus();

    // Configuración
    this.skippable = config.skippable !== false;
    this.autoStart = config.autoStart || false;
    this.preload = config.preload || false;

    // Assets
    this.assets = config.assets || {};
    this.loadedAssets = new Map();

    // Audio
    this.audioConfig = config.audio || null;
    this.audioController = null;

    // Camera
    this.cameraConfig = config.camera || null;
    this.cameraController = null;

    // Effects
    this.effects = config.effects || [];
    this.activeEffects = [];

    // Callbacks
    this.onStart = config.onStart;
    this.onUpdate = config.onUpdate;
    this.onComplete = config.onComplete;
    this.onSkip = config.onSkip;
    this.onError = config.onError;

    // Metadata
    this.duration = config.duration || 0;
    this.currentTime = 0;
    this.startTime = null;

    // Script de cinemática
    this.script = config.script;
  }

  /**
   * Cargar assets de la cinemática
   */
  async load() {
    if (this.state === CinematicState.LOADING || this.state === CinematicState.READY) {
      return;
    }

    this.setState(CinematicState.LOADING);
    this.eventBus.emit(CinematicEvent.LOAD_START, { cinematicId: this.id });

    try {
      // Cargar assets
      const assetPromises = Object.entries(this.assets).map(async ([key, asset]) => {
        const loaded = await this._loadAsset(asset);
        this.loadedAssets.set(key, loaded);
      });

      await Promise.all(assetPromises);

      // Ejecutar script de setup si existe
      if (this.script && this.script.setup) {
        await this.script.setup(this);
      }

      this.setState(CinematicState.READY);
      this.eventBus.emit(CinematicEvent.LOAD_COMPLETE, { cinematicId: this.id });

      if (this.autoStart) {
        this.play();
      }
    } catch (error) {
      this.setState(CinematicState.ERROR);
      this.eventBus.emit(CinematicEvent.ERROR, {
        cinematicId: this.id,
        error
      });

      if (this.onError) {
        this.onError(error);
      }

      throw error;
    }
  }

  /**
   * Cargar un asset individual
   */
  async _loadAsset(asset) {
    // Aquí implementaríamos la carga según el tipo de asset
    // Por ahora retornamos el asset tal cual
    return asset;
  }

  /**
   * Iniciar la cinemática
   */
  async play() {
    if (this.state === CinematicState.IDLE || this.state === CinematicState.LOADING) {
      await this.load();
    }

    if (this.state !== CinematicState.READY && this.state !== CinematicState.PAUSED) {
      console.warn('Cannot play cinematic in state:', this.state);
      return;
    }

    this.setState(CinematicState.PLAYING);
    this.startTime = performance.now();
    this.eventBus.emit(CinematicEvent.PLAY, { cinematicId: this.id });

    // Ejecutar script de inicio
    if (this.script && this.script.onStart) {
      await this.script.onStart(this);
    }

    // Iniciar audio
    if (this.audioController) {
      this.audioController.play();
    }

    // Iniciar timelines
    this.timelineEngine.timelines.forEach(timeline => {
      if (!timeline.isPlaying) {
        timeline.play();
      }
    });

    if (this.onStart) {
      this.onStart(this);
    }
  }

  /**
   * Pausar la cinemática
   */
  pause() {
    if (this.state !== CinematicState.PLAYING) return;

    this.setState(CinematicState.PAUSED);
    this.eventBus.emit(CinematicEvent.PAUSE, { cinematicId: this.id });

    // Pausar timelines
    this.timelineEngine.pauseAll();

    // Pausar audio
    if (this.audioController) {
      this.audioController.pause();
    }

    // Pausar animaciones
    this.animationEngine.pauseAll();
  }

  /**
   * Reanudar la cinemática
   */
  resume() {
    if (this.state !== CinematicState.PAUSED) return;

    this.setState(CinematicState.PLAYING);
    this.eventBus.emit(CinematicEvent.RESUME, { cinematicId: this.id });

    // Reanudar timelines
    this.timelineEngine.resumeAll();

    // Reanudar audio
    if (this.audioController) {
      this.audioController.resume();
    }

    // Reanudar animaciones
    this.animationEngine.resumeAll();
  }

  /**
   * Detener la cinemática
   */
  stop() {
    if (this.state === CinematicState.IDLE) return;

    this.setState(CinematicState.READY);
    this.currentTime = 0;
    this.eventBus.emit(CinematicEvent.STOP, { cinematicId: this.id });

    // Detener timelines
    this.timelineEngine.stopAll();

    // Detener audio
    if (this.audioController) {
      this.audioController.stop();
    }

    // Detener animaciones
    this.animationEngine.stopAll();

    // Limpiar efectos
    this._clearEffects();
  }

  /**
   * Saltar la cinemática
   */
  skip() {
    if (!this.skippable) return;

    this.eventBus.emit(CinematicEvent.STOP, {
      cinematicId: this.id,
      skipped: true
    });

    if (this.onSkip) {
      this.onSkip(this);
    }

    // Ir al final
    this.currentTime = this.duration;
    this.complete();
  }

  /**
   * Completar la cinemática
   */
  complete() {
    this.setState(CinematicState.COMPLETED);
    this.eventBus.emit(CinematicEvent.COMPLETE, { cinematicId: this.id });

    if (this.onComplete) {
      this.onComplete(this);
    }

    // Ejecutar script de finalización
    if (this.script && this.script.onComplete) {
      this.script.onComplete(this);
    }

    this.cleanup();
  }

  /**
   * Actualizar la cinemática
   */
  update(deltaTime) {
    if (this.state !== CinematicState.PLAYING) return;

    this.currentTime += deltaTime * 1000;

    // Actualizar timelines
    this.timelineEngine.update(deltaTime);

    // Actualizar animaciones
    this.animationEngine.update(deltaTime);

    // Actualizar efectos
    this._updateEffects(deltaTime);

    // Ejecutar script de update
    if (this.script && this.script.onUpdate) {
      this.script.onUpdate(this, deltaTime);
    }

    if (this.onUpdate) {
      this.onUpdate(this, this.currentTime);
    }

    // Verificar si completó
    if (this.duration > 0 && this.currentTime >= this.duration) {
      this.complete();
    }
  }

  /**
   * Actualizar efectos activos
   */
  _updateEffects(deltaTime) {
    this.activeEffects = this.activeEffects.filter(effect => {
      if (effect.update) {
        return effect.update(deltaTime);
      }
      return true;
    });
  }

  /**
   * Limpiar efectos
   */
  _clearEffects() {
    this.activeEffects.forEach(effect => {
      if (effect.cleanup) {
        effect.cleanup();
      }
    });
    this.activeEffects = [];
  }

  /**
   * Cambiar estado
   */
  setState(newState) {
    const oldState = this.state;
    this.state = newState;

    this.eventBus.emit('cinematic:stateChange', {
      cinematicId: this.id,
      oldState,
      newState
    });
  }

  /**
   * Obtener progreso (0-1)
   */
  getProgress() {
    return this.duration > 0 ? this.currentTime / this.duration : 0;
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    this.timelineEngine.clear();
    this.animationEngine.clear();
    this._clearEffects();
    this.loadedAssets.clear();

    if (this.audioController) {
      this.audioController.cleanup();
    }
  }

  /**
   * Destruir la cinemática
   */
  destroy() {
    this.stop();
    this.cleanup();
    this.eventBus.removeAllListeners(`cinematic:${this.id}`);
  }
}

/**
 * CinematicManager - Gestor global de cinemáticas
 */
export class CinematicManager {
  constructor() {
    this.cinematics = new Map();
    this.activeCinematic = null;
    this.queue = [];
    this.history = [];
    this.eventBus = getGlobalEventBus();
  }

  /**
   * Registrar una cinemática
   */
  register(config) {
    const cinematic = new Cinematic({
      ...config,
      eventBus: this.eventBus
    });

    this.cinematics.set(cinematic.id, cinematic);
    return cinematic;
  }

  /**
   * Obtener cinemática por ID
   */
  get(cinematicId) {
    return this.cinematics.get(cinematicId);
  }

  /**
   * Reproducir una cinemática
   */
  async play(cinematicId, options = {}) {
    const cinematic = this.cinematics.get(cinematicId);
    if (!cinematic) {
      throw new Error(`Cinematic not found: ${cinematicId}`);
    }

    // Si hay una cinemática activa
    if (this.activeCinematic) {
      if (options.force) {
        this.activeCinematic.stop();
      } else if (options.queue) {
        this.queue.push(cinematicId);
        return;
      } else {
        throw new Error('A cinematic is already playing');
      }
    }

    this.activeCinematic = cinematic;
    this.history.push({
      id: cinematicId,
      timestamp: Date.now()
    });

    await cinematic.play();
  }

  /**
   * Detener cinemática activa
   */
  stop() {
    if (this.activeCinematic) {
      this.activeCinematic.stop();
      this.activeCinematic = null;
    }
  }

  /**
   * Pausar cinemática activa
   */
  pause() {
    if (this.activeCinematic) {
      this.activeCinematic.pause();
    }
  }

  /**
   * Reanudar cinemática activa
   */
  resume() {
    if (this.activeCinematic) {
      this.activeCinematic.resume();
    }
  }

  /**
   * Saltar cinemática activa
   */
  skip() {
    if (this.activeCinematic && this.activeCinematic.skippable) {
      this.activeCinematic.skip();
    }
  }

  /**
   * Actualizar cinemáticas
   */
  update(deltaTime) {
    if (this.activeCinematic) {
      this.activeCinematic.update(deltaTime);

      // Si completó, pasar a la siguiente en la cola
      if (this.activeCinematic.state === CinematicState.COMPLETED) {
        this.activeCinematic = null;

        if (this.queue.length > 0) {
          const nextId = this.queue.shift();
          this.play(nextId);
        }
      }
    }
  }

  /**
   * Limpiar todas las cinemáticas
   */
  clear() {
    this.cinematics.forEach(cinematic => cinematic.destroy());
    this.cinematics.clear();
    this.activeCinematic = null;
    this.queue = [];
  }

  /**
   * Obtener estado actual
   */
  getState() {
    return {
      activeCinematic: this.activeCinematic?.id,
      queueLength: this.queue.length,
      totalCinematics: this.cinematics.size,
      history: this.history
    };
  }
}

// Instancia global singleton
let globalCinematicManager = null;

export function getGlobalCinematicManager() {
  if (!globalCinematicManager) {
    globalCinematicManager = new CinematicManager();
  }
  return globalCinematicManager;
}

export default CinematicManager;
