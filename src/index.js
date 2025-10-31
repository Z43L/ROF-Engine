/**
 * Reinado Olvidado Framework
 * Framework completo para desarrollo de videojuegos 3D
 * Compatible con React Web, React Native y Expo
 */

// Core Engine
export * from './core/index.js';

// Systems
export { default as InputSystem } from './systems/InputSystem.js';
export { default as AudioSystem, AudioCategory } from './systems/AudioSystem.js';

// Utils
export { default as Platform } from './utils/Platform.js';
export { default as EventEmitter } from './utils/EventEmitter.js';
export { ObjectPool, PoolManager } from './utils/Pool.js';

// Components Registry
export { ComponentRegistry } from './core/Component.js';

// Cinematic System (existente)
export * from './cinematic/index.js';

/**
 * Factory para crear un Engine configurado automáticamente según la plataforma
 */
import Engine from './core/Engine.js';
import InputSystem from './systems/InputSystem.js';
import AudioSystem from './systems/AudioSystem.js';
import Platform from './utils/Platform.js';

// Importación dinámica de adaptadores según plataforma
async function getInputAdapter() {
  if (Platform.isExpo) {
    const { default: ExpoInputAdapter } = await import('./adapters/expo/ExpoInputAdapter.js');
    return new ExpoInputAdapter();
  } else if (Platform.isNative) {
    const { default: NativeInputAdapter } = await import('./adapters/native/NativeInputAdapter.js');
    return new NativeInputAdapter();
  } else {
    const { default: WebInputAdapter } = await import('./adapters/web/WebInputAdapter.js');
    return new WebInputAdapter();
  }
}

async function getAudioAdapter() {
  if (Platform.isExpo || Platform.isNative) {
    const { default: ExpoAudioAdapter } = await import('./adapters/expo/ExpoAudioAdapter.js');
    return new ExpoAudioAdapter();
  } else {
    const { default: WebAudioAdapter } = await import('./adapters/web/WebAudioAdapter.js');
    return new WebAudioAdapter();
  }
}

/**
 * Crea un engine con todos los sistemas básicos configurados
 * @param {Object} config - Configuración del engine
 * @returns {Promise<Engine>} Engine configurado
 */
export async function createEngine(config = {}) {
  const {
    includeInput = true,
    includeAudio = true,
    includePhysics = false,
    ...engineConfig
  } = config;

  const engine = new Engine(engineConfig);

  // Registrar sistema de input
  if (includeInput) {
    const inputAdapter = await getInputAdapter();
    const inputSystem = new InputSystem(inputAdapter);
    engine.registerSystem(inputSystem);
  }

  // Registrar sistema de audio
  if (includeAudio) {
    const audioAdapter = await getAudioAdapter();
    const audioSystem = new AudioSystem(audioAdapter);
    engine.registerSystem(audioSystem);
  }

  // TODO: Registrar sistema de física si se solicita
  // if (includePhysics) {
  //   const physicsSystem = new PhysicsSystem();
  //   engine.registerSystem(physicsSystem);
  // }

  return engine;
}

/**
 * Información sobre el framework
 */
export const VERSION = '0.1.0';
export const FRAMEWORK_NAME = 'Reinado Olvidado';

/**
 * Información de plataforma actual
 */
export const PLATFORM_INFO = Platform.info;

/**
 * Utilidad para log del framework
 */
export function logFrameworkInfo() {
  console.log(`
╔════════════════════════════════════════╗
║   ${FRAMEWORK_NAME} Framework v${VERSION}      ║
╠════════════════════════════════════════╣
║ Platform: ${PLATFORM_INFO.platform.padEnd(28)}║
║ Web:      ${PLATFORM_INFO.isWeb.toString().padEnd(28)}║
║ Native:   ${PLATFORM_INFO.isNative.toString().padEnd(28)}║
║ Expo:     ${PLATFORM_INFO.isExpo.toString().padEnd(28)}║
╚════════════════════════════════════════╝
  `);
}

// Export default para import simplificado
export default {
  createEngine,
  VERSION,
  FRAMEWORK_NAME,
  Platform,
  logFrameworkInfo
};
