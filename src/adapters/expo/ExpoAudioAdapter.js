/**
 * ExpoAudioAdapter
 * Adaptador de audio para Expo usando expo-av
 */

class ExpoAudioAdapter {
  constructor() {
    this.Audio = null;
    this.sounds = new Map();
    this.initialized = false;
  }

  async init(emitter) {
    this.emitter = emitter;

    try {
      const ExpoAV = await import('expo-av');
      this.Audio = ExpoAV.Audio;

      // Configurar modo de audio
      await this.Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      this.initialized = true;
      this.emitter?.emit('audioInitialized');
    } catch (error) {
      console.error('Failed to initialize Expo Audio:', error);
    }
  }

  /**
   * Carga un sonido
   */
  async loadSound(uri, options = {}) {
    if (!this.initialized || !this.Audio) {
      throw new Error('Audio not initialized');
    }

    try {
      const { sound } = await this.Audio.Sound.createAsync(
        typeof uri === 'string' ? { uri } : uri,
        {
          shouldPlay: false,
          isLooping: false,
          volume: 1.0
        }
      );

      const soundData = {
        sound,
        uri,
        loaded: true
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
  async unloadSound(soundData) {
    if (soundData.sound) {
      try {
        await soundData.sound.unloadAsync();
      } catch (error) {
        console.warn('Failed to unload sound:', error);
      }
    }
  }

  /**
   * Reproduce un sonido
   */
  async playSound(soundData, options = {}) {
    if (!soundData.sound) return;

    try {
      // Configurar opciones
      await soundData.sound.setVolumeAsync(options.volume !== undefined ? options.volume : 1);
      await soundData.sound.setIsLoopingAsync(options.loop || false);

      // Configurar callback de fin
      if (options.onEnd) {
        soundData.sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish && !status.isLooping) {
            options.onEnd();
          }
        });
      }

      // Reproducir
      await soundData.sound.playAsync();
    } catch (error) {
      console.error('Failed to play sound:', error);
    }

    return soundData;
  }

  /**
   * Detiene un sonido
   */
  async stopSound(soundData) {
    if (!soundData.sound) return;

    try {
      await soundData.sound.stopAsync();
      await soundData.sound.setPositionAsync(0);
    } catch (error) {
      console.warn('Failed to stop sound:', error);
    }
  }

  /**
   * Pausa un sonido
   */
  async pauseSound(soundData) {
    if (!soundData.sound) return;

    try {
      await soundData.sound.pauseAsync();
    } catch (error) {
      console.warn('Failed to pause sound:', error);
    }
  }

  /**
   * Reanuda un sonido
   */
  async resumeSound(soundData, options) {
    if (!soundData.sound) return;

    try {
      if (options.volume !== undefined) {
        await soundData.sound.setVolumeAsync(options.volume);
      }
      await soundData.sound.playAsync();
    } catch (error) {
      console.warn('Failed to resume sound:', error);
    }
  }

  /**
   * Establece el volumen
   */
  async setVolume(soundData, volume) {
    if (!soundData.sound) return;

    try {
      await soundData.sound.setVolumeAsync(volume);
    } catch (error) {
      console.warn('Failed to set volume:', error);
    }
  }

  // Expo AV no soporta audio 3D posicional de forma nativa
  // Estas funciones están presentes para compatibilidad pero no hacen nada
  setListenerPosition(x, y, z) {
    // No soportado en Expo AV
  }

  setListenerOrientation(fx, fy, fz, ux, uy, uz) {
    // No soportado en Expo AV
  }

  setSoundPosition(soundData, x, y, z) {
    // No soportado en Expo AV
    // El cálculo de atenuación se hace en AudioSystem
  }

  async destroy() {
    for (const [id, soundData] of this.sounds) {
      await this.unloadSound(soundData);
    }
    this.sounds.clear();
  }
}

export default ExpoAudioAdapter;
