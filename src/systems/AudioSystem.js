/**
 * AudioSystem
 * Sistema de audio multiplataforma
 * Maneja música, efectos de sonido y audio 3D posicional
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';

/**
 * AudioCategory - Categorías de audio para control de volumen
 */
const AudioCategory = {
  MUSIC: 'music',
  SFX: 'sfx',
  VOICE: 'voice',
  AMBIENT: 'ambient',
  UI: 'ui'
};

/**
 * SoundInstance - Representa una instancia de sonido en reproducción
 */
class SoundInstance {
  constructor(id, sound, options = {}) {
    this.id = id;
    this.sound = sound;
    this.category = options.category || AudioCategory.SFX;
    this.volume = options.volume !== undefined ? options.volume : 1;
    this.loop = options.loop || false;
    this.playing = false;
    this.paused = false;
    this.position = 0;
    this.duration = 0;

    // Audio 3D
    this.is3D = options.is3D || false;
    this.position3D = options.position3D || { x: 0, y: 0, z: 0 };
    this.maxDistance = options.maxDistance || 100;
    this.refDistance = options.refDistance || 1;
  }
}

/**
 * AudioSystem
 */
class AudioSystem extends System {
  constructor(adapter) {
    super('AudioSystem', [], 50); // Prioridad media
    this.adapter = adapter;
    this.emitter = new EventEmitter();

    // Gestión de sonidos
    this.sounds = new Map(); // id -> sound data
    this.instances = new Map(); // instanceId -> SoundInstance
    this.nextInstanceId = 1;

    // Control de volumen por categoría
    this.categoryVolumes = {
      [AudioCategory.MUSIC]: 0.7,
      [AudioCategory.SFX]: 1.0,
      [AudioCategory.VOICE]: 1.0,
      [AudioCategory.AMBIENT]: 0.5,
      [AudioCategory.UI]: 0.8
    };

    this.masterVolume = 1.0;
    this.muted = false;

    // Listener 3D (cámara/jugador)
    this.listener = {
      position: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
      up: { x: 0, y: 1, z: 0 }
    };
  }

  init(world) {
    super.init(world);
    this.adapter.init(this.emitter);
  }

  // ===== Asset Management =====

  /**
   * Carga un sonido
   * @param {string} id - Identificador único
   * @param {string} uri - URI del archivo de audio
   * @param {Object} options - Opciones (category, preload, etc.)
   */
  async loadSound(id, uri, options = {}) {
    try {
      const sound = await this.adapter.loadSound(uri, options);

      this.sounds.set(id, {
        id,
        sound,
        uri,
        category: options.category || AudioCategory.SFX,
        loaded: true
      });

      this.emitter.emit('soundLoaded', { id, uri });
      return sound;
    } catch (error) {
      console.error(`Failed to load sound '${id}':`, error);
      this.emitter.emit('soundLoadError', { id, uri, error });
      throw error;
    }
  }

  /**
   * Descarga un sonido
   */
  unloadSound(id) {
    const soundData = this.sounds.get(id);
    if (!soundData) return;

    // Detener todas las instancias
    this.instances.forEach((instance, instanceId) => {
      if (instance.sound === soundData.sound) {
        this.stopSound(instanceId);
      }
    });

    this.adapter.unloadSound(soundData.sound);
    this.sounds.delete(id);

    this.emitter.emit('soundUnloaded', { id });
  }

  // ===== Playback Control =====

  /**
   * Reproduce un sonido
   * @returns {number} instanceId - ID de la instancia para controlarla
   */
  playSound(id, options = {}) {
    const soundData = this.sounds.get(id);
    if (!soundData) {
      console.warn(`Sound '${id}' not loaded`);
      return null;
    }

    const instanceId = this.nextInstanceId++;
    const instance = new SoundInstance(instanceId, soundData.sound, {
      category: soundData.category,
      ...options
    });

    this.instances.set(instanceId, instance);

    // Calcular volumen final
    const finalVolume = this._calculateFinalVolume(instance);

    // Reproducir usando el adapter
    this.adapter.playSound(soundData.sound, {
      volume: finalVolume,
      loop: instance.loop,
      onEnd: () => {
        if (!instance.loop) {
          this.instances.delete(instanceId);
          this.emitter.emit('soundEnded', { instanceId, id });
        }
      }
    });

    instance.playing = true;

    this.emitter.emit('soundPlayed', { instanceId, id });

    return instanceId;
  }

  /**
   * Detiene un sonido
   */
  stopSound(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    this.adapter.stopSound(instance.sound);
    instance.playing = false;
    this.instances.delete(instanceId);

    this.emitter.emit('soundStopped', { instanceId });
  }

  /**
   * Pausa un sonido
   */
  pauseSound(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance || !instance.playing) return;

    this.adapter.pauseSound(instance.sound);
    instance.playing = false;
    instance.paused = true;

    this.emitter.emit('soundPaused', { instanceId });
  }

  /**
   * Reanuda un sonido
   */
  resumeSound(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance || !instance.paused) return;

    const finalVolume = this._calculateFinalVolume(instance);
    this.adapter.resumeSound(instance.sound, { volume: finalVolume });

    instance.playing = true;
    instance.paused = false;

    this.emitter.emit('soundResumed', { instanceId });
  }

  /**
   * Detiene todos los sonidos
   */
  stopAll(category = null) {
    this.instances.forEach((instance, instanceId) => {
      if (!category || instance.category === category) {
        this.stopSound(instanceId);
      }
    });
  }

  // ===== Volume Control =====

  /**
   * Establece el volumen maestro
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this._updateAllVolumes();
    this.emitter.emit('masterVolumeChanged', { volume: this.masterVolume });
  }

  /**
   * Establece el volumen de una categoría
   */
  setCategoryVolume(category, volume) {
    this.categoryVolumes[category] = Math.max(0, Math.min(1, volume));
    this._updateAllVolumes();
    this.emitter.emit('categoryVolumeChanged', { category, volume });
  }

  /**
   * Establece el volumen de una instancia específica
   */
  setInstanceVolume(instanceId, volume) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.volume = Math.max(0, Math.min(1, volume));

    if (instance.playing) {
      const finalVolume = this._calculateFinalVolume(instance);
      this.adapter.setVolume(instance.sound, finalVolume);
    }
  }

  /**
   * Silencia/activa todo el audio
   */
  setMuted(muted) {
    this.muted = muted;
    this._updateAllVolumes();
    this.emitter.emit('mutedChanged', { muted });
  }

  _calculateFinalVolume(instance) {
    if (this.muted) return 0;

    let volume = instance.volume;
    volume *= this.categoryVolumes[instance.category] || 1;
    volume *= this.masterVolume;

    // Si es audio 3D, aplicar atenuación por distancia
    if (instance.is3D) {
      const distance = this._calculateDistance(
        this.listener.position,
        instance.position3D
      );
      const attenuation = this._calculateAttenuation(
        distance,
        instance.refDistance,
        instance.maxDistance
      );
      volume *= attenuation;
    }

    return Math.max(0, Math.min(1, volume));
  }

  _updateAllVolumes() {
    this.instances.forEach((instance, instanceId) => {
      if (instance.playing) {
        const finalVolume = this._calculateFinalVolume(instance);
        this.adapter.setVolume(instance.sound, finalVolume);
      }
    });
  }

  // ===== 3D Audio =====

  /**
   * Actualiza la posición del listener (cámara)
   */
  setListenerPosition(x, y, z) {
    this.listener.position = { x, y, z };
    this.adapter.setListenerPosition?.(x, y, z);
  }

  /**
   * Actualiza la orientación del listener
   */
  setListenerOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ) {
    this.listener.forward = { x: forwardX, y: forwardY, z: forwardZ };
    this.listener.up = { x: upX, y: upY, z: upZ };
    this.adapter.setListenerOrientation?.(
      forwardX, forwardY, forwardZ,
      upX, upY, upZ
    );
  }

  /**
   * Actualiza la posición de un sonido 3D
   */
  setSoundPosition(instanceId, x, y, z) {
    const instance = this.instances.get(instanceId);
    if (!instance || !instance.is3D) return;

    instance.position3D = { x, y, z };

    if (instance.playing) {
      // Recalcular volumen
      const finalVolume = this._calculateFinalVolume(instance);
      this.adapter.setVolume(instance.sound, finalVolume);

      // Actualizar posición en el adapter si soporta audio 3D nativo
      this.adapter.setSoundPosition?.(instance.sound, x, y, z);
    }
  }

  _calculateDistance(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  _calculateAttenuation(distance, refDistance, maxDistance) {
    if (distance <= refDistance) return 1;
    if (distance >= maxDistance) return 0;

    // Atenuación lineal
    return 1 - ((distance - refDistance) / (maxDistance - refDistance));
  }

  // ===== System Update =====

  update(deltaTime) {
    super.update(deltaTime);

    // Actualizar posiciones de audio 3D automáticamente desde componentes
    const entities = this.world.getEntitiesWithComponents('transform', 'audioSource');

    entities.forEach(entity => {
      const transform = entity.getComponent('transform');
      const audioSource = entity.getComponent('audioSource');

      if (audioSource.instanceId && audioSource.is3D) {
        this.setSoundPosition(
          audioSource.instanceId,
          transform.x,
          transform.y,
          transform.z
        );
      }
    });

    // Actualizar listener desde cámara activa
    const cameras = this.world.getEntitiesWithComponents('transform', 'camera');
    const activeCamera = cameras.find(e => e.getComponent('camera').active);

    if (activeCamera) {
      const transform = activeCamera.getComponent('transform');
      this.setListenerPosition(transform.x, transform.y, transform.z);
    }
  }

  // ===== Event Listeners =====

  on(event, callback) {
    return this.emitter.on(event, callback);
  }

  off(event, callback) {
    this.emitter.off(event, callback);
  }

  destroy() {
    super.destroy();
    this.stopAll();
    this.sounds.forEach((soundData, id) => this.unloadSound(id));
    this.adapter.destroy();
    this.emitter.removeAllListeners();
  }
}

export default AudioSystem;
export { AudioCategory, SoundInstance };
