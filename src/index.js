/**
 * ROF-Engine (Reinado Olvidado Framework)
 * Complete 3D Game Engine Framework for React, React Native & Expo
 *
 * @version 1.0.0
 * @author ReinadoOlvidado Team
 * @license MIT
 */

// Core Engine
export * from './core/index.js';

// Game Engine (Alternative)
export { GameEngine, useGameEngine } from './engine/GameEngine.js';

// Systems
export { default as InputSystem } from './systems/InputSystem.js';
export { default as AudioSystem, AudioCategory, SoundInstance } from './systems/AudioSystem.js';
export { default as PhysicsSystem } from './systems/PhysicsSystem.js';
export { default as UISystem } from './systems/UISystem.js';
export { default as RenderSystem } from './systems/RenderSystem.js';
export { default as MeshSystem } from './systems/MeshSystem.js';
export { default as LightSystem } from './systems/LightSystem.js';
export { default as AssetSystem } from './systems/AssetSystem.js';
export { default as CameraSystem } from './systems/CameraSystem.js';
export { default as SkyboxSystem } from './systems/SkyboxSystem.js';
export { default as DebugSystem } from './systems/DebugSystem.js';

// Utils
export { default as Platform } from './utils/Platform.js';
export { default as EventEmitter } from './utils/EventEmitter.js';
export { ObjectPool, PoolManager } from './utils/Pool.js';

// Components Registry
export { ComponentRegistry } from './core/Component.js';

// UI Components
export * as UIComponents from './components/ui/UIComponent.js';
export { default as Scene3D } from './components/Scene3D.js';
export { default as Camera3D } from './components/Camera3D.js';
export { default as Ground } from './components/Ground.js';
export { default as MeshComponent } from './components/3d/Mesh.js';
export { default as LightComponent } from './components/3d/Light.js';

// Cinematic System
export * from './cinematic/index.js';

// React Integration
export * from './react/Game.js';
export * from './react/RenderSystem.js';
export * from './react/UISystem.js';
export * from './react/LightComponent.js';
export * from './react/MeshComponent.js';

// Adapters
export { default as WebInputAdapter } from './adapters/web/WebInputAdapter.js';
export { default as WebAudioAdapter } from './adapters/web/WebAudioAdapter.js';
export { default as ExpoInputAdapter } from './adapters/expo/ExpoInputAdapter.js';
export { default as ExpoAudioAdapter } from './adapters/expo/ExpoAudioAdapter.js';
export { default as NativeInputAdapter } from './adapters/native/NativeInputAdapter.js';

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
    includeDebug = false,
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

  // Registrar sistema de renderizado
  const renderSystem = new RenderSystem();
  engine.registerSystem(renderSystem);

  // Registrar sistema de mallas
  const meshSystem = new MeshSystem();
  engine.registerSystem(meshSystem);

  // Registrar sistema de luces
  const lightSystem = new LightSystem();
  engine.registerSystem(lightSystem);

  // Registrar sistema de cámara
  const cameraSystem = new CameraSystem();
  engine.registerSystem(cameraSystem);

  // Registrar sistema de skybox
  const skyboxSystem = new SkyboxSystem();
  engine.registerSystem(skyboxSystem);

  // Registrar sistema de debug (deshabilitado por defecto)
  if (config.includeDebug) {
    const debugSystem = new DebugSystem();
    debugSystem.setEnabled(true);
    debugSystem.setVisible(false);
    engine.registerSystem(debugSystem);
  }

  // Registrar sistema de física si se solicita
  if (includePhysics) {
    const physicsSystem = new PhysicsSystem();
    engine.registerSystem(physicsSystem);
  }

  return engine;
}

/**
 * Información sobre el framework
 */
export const VERSION = '1.0.0';
export const FRAMEWORK_NAME = 'ROF-Engine (Reinado Olvidado Framework)';

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
