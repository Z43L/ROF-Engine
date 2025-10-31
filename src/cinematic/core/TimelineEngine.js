/**
 * TIMELINE ENGINE - Sistema de secuencias temporales
 * Maneja keyframes, tracks y sincronización temporal
 */

import { TimelineDefaults, CinematicEvent } from '../types';
import { getGlobalEventBus } from './EventBus';

/**
 * Keyframe - Punto clave en el timeline
 */
export class Keyframe {
  constructor(config) {
    this.time = config.time || 0;
    this.values = config.values || {};
    this.easing = config.easing || 'linear';
    this.onReach = config.onReach;
    this.label = config.label;
    this.reached = false;
  }

  reset() {
    this.reached = false;
  }
}

/**
 * Track - Pista de animación en el timeline
 */
export class Track {
  constructor(config) {
    this.id = config.id || `track_${Date.now()}`;
    this.target = config.target;
    this.property = config.property;
    this.keyframes = (config.keyframes || []).map(kf => new Keyframe(kf));
    this.enabled = config.enabled !== false;

    // Ordenar keyframes por tiempo
    this.keyframes.sort((a, b) => a.time - b.time);
  }

  /**
   * Obtener valor interpolado en un tiempo dado
   */
  getValueAtTime(time) {
    if (this.keyframes.length === 0) return null;

    // Antes del primer keyframe
    if (time <= this.keyframes[0].time) {
      return this.keyframes[0].values;
    }

    // Después del último keyframe
    if (time >= this.keyframes[this.keyframes.length - 1].time) {
      return this.keyframes[this.keyframes.length - 1].values;
    }

    // Entre keyframes - interpolar
    for (let i = 0; i < this.keyframes.length - 1; i++) {
      const kf1 = this.keyframes[i];
      const kf2 = this.keyframes[i + 1];

      if (time >= kf1.time && time <= kf2.time) {
        const t = (time - kf1.time) / (kf2.time - kf1.time);
        return this._interpolate(kf1.values, kf2.values, t, kf1.easing);
      }
    }

    return null;
  }

  /**
   * Interpolar entre dos valores
   */
  _interpolate(v1, v2, t, easing) {
    // Aquí aplicaríamos la función de easing
    // Por simplicidad, usamos interpolación lineal
    if (typeof v1 === 'number' && typeof v2 === 'number') {
      return v1 + (v2 - v1) * t;
    }

    if (typeof v1 === 'object' && typeof v2 === 'object') {
      const result = {};
      Object.keys(v1).forEach(key => {
        if (typeof v1[key] === 'number' && typeof v2[key] === 'number') {
          result[key] = v1[key] + (v2[key] - v1[key]) * t;
        }
      });
      return result;
    }

    return v2;
  }

  /**
   * Agregar keyframe
   */
  addKeyframe(keyframe) {
    this.keyframes.push(new Keyframe(keyframe));
    this.keyframes.sort((a, b) => a.time - b.time);
  }

  /**
   * Resetear estado de keyframes
   */
  reset() {
    this.keyframes.forEach(kf => kf.reset());
  }
}

/**
 * Timeline - Secuenciador principal
 */
export class Timeline {
  constructor(config = {}) {
    this.id = config.id || `timeline_${Date.now()}`;
    this.duration = config.duration || TimelineDefaults.duration;
    this.loop = config.loop || false;
    this.autoPlay = config.autoPlay !== false;

    this.tracks = new Map();
    this.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.playbackRate = 1;

    this.onStart = config.onStart;
    this.onUpdate = config.onUpdate;
    this.onComplete = config.onComplete;
    this.onLoop = config.onLoop;

    this.eventBus = config.eventBus || getGlobalEventBus();

    // Crear tracks si se proporcionaron
    if (config.tracks) {
      config.tracks.forEach(trackConfig => {
        this.addTrack(new Track(trackConfig));
      });
    }
  }

  /**
   * Agregar track
   */
  addTrack(track) {
    this.tracks.set(track.id, track);
    return track;
  }

  /**
   * Remover track
   */
  removeTrack(trackId) {
    this.tracks.delete(trackId);
  }

  /**
   * Obtener track
   */
  getTrack(trackId) {
    return this.tracks.get(trackId);
  }

  /**
   * Reproducir timeline
   */
  play() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.isPaused = false;

    if (this.onStart) {
      this.onStart(this);
    }

    this.eventBus.emit(CinematicEvent.TIMELINE_START, {
      timelineId: this.id
    });
  }

  /**
   * Pausar timeline
   */
  pause() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
  }

  /**
   * Reanudar timeline
   */
  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
  }

  /**
   * Detener timeline
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.reset();
  }

  /**
   * Ir a un tiempo específico
   */
  seek(time) {
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    this._updateTracks();
  }

  /**
   * Actualizar timeline
   */
  update(deltaTime) {
    if (!this.isPlaying || this.isPaused) return;

    // Actualizar tiempo
    this.currentTime += deltaTime * 1000 * this.playbackRate;

    // Verificar si completó
    if (this.currentTime >= this.duration) {
      if (this.loop) {
        this.currentTime = 0;
        this.reset();

        if (this.onLoop) {
          this.onLoop(this);
        }

        this.eventBus.emit(CinematicEvent.TIMELINE_END, {
          timelineId: this.id,
          looping: true
        });
      } else {
        this.currentTime = this.duration;
        this.isPlaying = false;

        if (this.onComplete) {
          this.onComplete(this);
        }

        this.eventBus.emit(CinematicEvent.TIMELINE_END, {
          timelineId: this.id,
          looping: false
        });

        return;
      }
    }

    // Actualizar tracks
    this._updateTracks();

    if (this.onUpdate) {
      this.onUpdate(this, this.currentTime);
    }
  }

  /**
   * Actualizar todos los tracks
   */
  _updateTracks() {
    this.tracks.forEach(track => {
      if (!track.enabled) return;

      const value = track.getValueAtTime(this.currentTime);

      if (value !== null && track.target) {
        if (track.property) {
          // Aplicar valor a una propiedad específica
          if (typeof value === 'object' && value !== null) {
            Object.assign(track.target[track.property], value);
          } else {
            track.target[track.property] = value;
          }
        } else {
          // Aplicar valores directamente al target
          Object.assign(track.target, value);
        }
      }

      // Verificar keyframes alcanzados
      track.keyframes.forEach(kf => {
        if (!kf.reached && this.currentTime >= kf.time) {
          kf.reached = true;

          if (kf.onReach) {
            kf.onReach(kf, this);
          }

          this.eventBus.emit(CinematicEvent.KEYFRAME_REACHED, {
            timelineId: this.id,
            trackId: track.id,
            keyframe: kf,
            time: this.currentTime
          });
        }
      });
    });
  }

  /**
   * Resetear estado del timeline
   */
  reset() {
    this.tracks.forEach(track => track.reset());
  }

  /**
   * Obtener progreso (0-1)
   */
  getProgress() {
    return this.currentTime / this.duration;
  }

  /**
   * Establecer velocidad de reproducción
   */
  setPlaybackRate(rate) {
    this.playbackRate = Math.max(0, rate);
  }

  /**
   * Crear track de forma fluida
   */
  createTrack(target, property) {
    const track = new Track({
      id: `${this.id}_track_${this.tracks.size}`,
      target,
      property,
      keyframes: []
    });

    this.addTrack(track);

    return {
      to: (time, values, easing = 'linear') => {
        track.addKeyframe({ time, values, easing });
        return this;
      },
      track
    };
  }
}

/**
 * TimelineEngine - Gestor de múltiples timelines
 */
export class TimelineEngine {
  constructor() {
    this.timelines = new Map();
    this.activeTimeline = null;
  }

  /**
   * Crear un nuevo timeline
   */
  create(config) {
    const timeline = new Timeline(config);
    this.timelines.set(timeline.id, timeline);

    if (timeline.autoPlay) {
      timeline.play();
    }

    return timeline;
  }

  /**
   * Obtener timeline
   */
  get(timelineId) {
    return this.timelines.get(timelineId);
  }

  /**
   * Remover timeline
   */
  remove(timelineId) {
    const timeline = this.timelines.get(timelineId);
    if (timeline) {
      timeline.stop();
      this.timelines.delete(timelineId);
    }
  }

  /**
   * Actualizar todos los timelines
   */
  update(deltaTime) {
    this.timelines.forEach(timeline => {
      timeline.update(deltaTime);
    });
  }

  /**
   * Pausar todos los timelines
   */
  pauseAll() {
    this.timelines.forEach(timeline => timeline.pause());
  }

  /**
   * Reanudar todos los timelines
   */
  resumeAll() {
    this.timelines.forEach(timeline => timeline.resume());
  }

  /**
   * Detener todos los timelines
   */
  stopAll() {
    this.timelines.forEach(timeline => timeline.stop());
  }

  /**
   * Limpiar todos los timelines
   */
  clear() {
    this.stopAll();
    this.timelines.clear();
    this.activeTimeline = null;
  }
}

export default TimelineEngine;
