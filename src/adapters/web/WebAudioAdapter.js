/**
 * WebAudioAdapter
 * Adaptador de audio para navegadores web usando Web Audio API
 * Soporte completo para audio 3D posicional
 */

class WebAudioAdapter {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.gainNodes = new Map();
    this.pannerNodes = new Map();
    this.masterGain = null;
    this.listener = null;
  }

  init(emitter) {
    this.emitter = emitter;

    // Crear AudioContext (lazy para evitar problemas de autoplay)
    this._initAudioContext();
  }

  _initAudioContext() {
    if (this.audioContext) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);

      // Listener (AudioListener está siempre disponible en AudioContext)
      this.listener = this.audioContext.listener;

      this.emitter?.emit('audioContextCreated');
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
    }
  }

  /**
   * Carga un sonido desde una URL
   */
  async loadSound(uri, options = {}) {
    this._initAudioContext();

    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const soundData = {
        buffer: audioBuffer,
        uri,
        source: null,
        gainNode: null,
        pannerNode: null
      };

      return soundData;
    } catch (error) {
      console.error('Failed to load sound:', error);
      throw error;
    }
  }

  /**
   * Descarga un sonido
   */
  unloadSound(soundData) {
    if (soundData.source) {
      soundData.source.stop();
      soundData.source.disconnect();
    }
    if (soundData.gainNode) {
      soundData.gainNode.disconnect();
    }
    if (soundData.pannerNode) {
      soundData.pannerNode.disconnect();
    }
  }

  /**
   * Reproduce un sonido
   */
  playSound(soundData, options = {}) {
    this._initAudioContext();

    // Resume context si está suspendido (requerido para autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Crear source
    const source = this.audioContext.createBufferSource();
    source.buffer = soundData.buffer;
    source.loop = options.loop || false;

    // Crear gain node para control de volumen
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = options.volume !== undefined ? options.volume : 1;

    // Conectar source -> gain -> destination
    source.connect(gainNode);

    // Si es audio 3D, crear panner node
    if (options.is3D) {
      const pannerNode = this.audioContext.createPanner();
      pannerNode.panningModel = 'HRTF';
      pannerNode.distanceModel = 'inverse';
      pannerNode.refDistance = options.refDistance || 1;
      pannerNode.maxDistance = options.maxDistance || 100;
      pannerNode.rolloffFactor = 1;

      if (options.position3D) {
        pannerNode.setPosition(
          options.position3D.x,
          options.position3D.y,
          options.position3D.z
        );
      }

      gainNode.connect(pannerNode);
      pannerNode.connect(this.masterGain);

      soundData.pannerNode = pannerNode;
    } else {
      gainNode.connect(this.masterGain);
    }

    // Callback cuando termina
    source.onended = () => {
      if (options.onEnd) {
        options.onEnd();
      }
    };

    // Iniciar reproducción
    source.start(0);

    // Guardar referencias
    soundData.source = source;
    soundData.gainNode = gainNode;

    return soundData;
  }

  /**
   * Detiene un sonido
   */
  stopSound(soundData) {
    if (soundData.source) {
      try {
        soundData.source.stop();
      } catch (e) {
        // Ya estaba detenido
      }
      soundData.source.disconnect();
      soundData.source = null;
    }

    if (soundData.gainNode) {
      soundData.gainNode.disconnect();
      soundData.gainNode = null;
    }

    if (soundData.pannerNode) {
      soundData.pannerNode.disconnect();
      soundData.pannerNode = null;
    }
  }

  /**
   * Pausa un sonido (Web Audio API no tiene pause nativo)
   */
  pauseSound(soundData) {
    // Web Audio API no tiene pause directo, habría que guardar el tiempo y recrear
    // Por simplicidad, detenemos
    this.stopSound(soundData);
  }

  /**
   * Reanuda un sonido
   */
  resumeSound(soundData, options) {
    // En Web Audio tendríamos que volver a crear el source
    // Por ahora, simplemente reproducimos desde el inicio
    this.playSound(soundData, options);
  }

  /**
   * Establece el volumen de un sonido
   */
  setVolume(soundData, volume) {
    if (soundData.gainNode) {
      soundData.gainNode.gain.value = volume;
    }
  }

  /**
   * Establece la posición del listener
   */
  setListenerPosition(x, y, z) {
    if (this.listener) {
      if (this.listener.positionX) {
        // API moderna
        this.listener.positionX.value = x;
        this.listener.positionY.value = y;
        this.listener.positionZ.value = z;
      } else {
        // API legacy
        this.listener.setPosition(x, y, z);
      }
    }
  }

  /**
   * Establece la orientación del listener
   */
  setListenerOrientation(fx, fy, fz, ux, uy, uz) {
    if (this.listener) {
      if (this.listener.forwardX) {
        // API moderna
        this.listener.forwardX.value = fx;
        this.listener.forwardY.value = fy;
        this.listener.forwardZ.value = fz;
        this.listener.upX.value = ux;
        this.listener.upY.value = uy;
        this.listener.upZ.value = uz;
      } else {
        // API legacy
        this.listener.setOrientation(fx, fy, fz, ux, uy, uz);
      }
    }
  }

  /**
   * Establece la posición de un sonido 3D
   */
  setSoundPosition(soundData, x, y, z) {
    if (soundData.pannerNode) {
      if (soundData.pannerNode.positionX) {
        // API moderna
        soundData.pannerNode.positionX.value = x;
        soundData.pannerNode.positionY.value = y;
        soundData.pannerNode.positionZ.value = z;
      } else {
        // API legacy
        soundData.pannerNode.setPosition(x, y, z);
      }
    }
  }

  destroy() {
    this.sounds.forEach(soundData => this.unloadSound(soundData));
    this.sounds.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export default WebAudioAdapter;
