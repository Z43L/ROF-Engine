/**
 * TYPES Y CONSTANTES DEL SISTEMA DE CINEMÁTICAS
 */

// Estados de cinemáticas
export const CinematicState = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ERROR: 'error'
};

// Tipos de interpolación
export const EasingType = {
  LINEAR: 'linear',
  EASE_IN: 'easeIn',
  EASE_OUT: 'easeOut',
  EASE_IN_OUT: 'easeInOut',
  SPRING: 'spring',
  BOUNCE: 'bounce',
  ELASTIC: 'elastic',
  BEZIER: 'bezier'
};

// Tipos de eventos
export const CinematicEvent = {
  // Lifecycle
  LOAD_START: 'cinematic:loadStart',
  LOAD_COMPLETE: 'cinematic:loadComplete',
  START: 'cinematic:start',
  PLAY: 'cinematic:play',
  PAUSE: 'cinematic:pause',
  RESUME: 'cinematic:resume',
  STOP: 'cinematic:stop',
  COMPLETE: 'cinematic:complete',
  ERROR: 'cinematic:error',

  // Timeline
  TIMELINE_START: 'timeline:start',
  TIMELINE_END: 'timeline:end',
  KEYFRAME_REACHED: 'keyframe:reached',

  // Audio
  AUDIO_SYNC: 'audio:sync',
  AUDIO_CUE: 'audio:cue',

  // Camera
  CAMERA_MOVE: 'camera:move',
  CAMERA_TARGET: 'camera:target',

  // Custom
  CUSTOM: 'custom'
};

// Tipos de efectos
export const EffectType = {
  FADE: 'fade',
  SHAKE: 'shake',
  ZOOM: 'zoom',
  BLUR: 'blur',
  COLOR_SHIFT: 'colorShift',
  PARTICLES: 'particles',
  FLASH: 'flash',
  DISTORTION: 'distortion',
  VIGNETTE: 'vignette',
  CHROMATIC_ABERRATION: 'chromaticAberration'
};

// Configuración de animación
export const AnimationDefaults = {
  duration: 1000,
  easing: EasingType.LINEAR,
  delay: 0,
  loop: false,
  yoyo: false,
  autoPlay: true
};

// Configuración de timeline
export const TimelineDefaults = {
  duration: 5000,
  loop: false,
  autoPlay: true
};

// Prioridades de capas
export const LayerPriority = {
  BACKGROUND: 0,
  GAME: 100,
  UI: 200,
  CINEMATIC: 300,
  OVERLAY: 400
};

// Tipos de sprites
export const SpriteType = {
  STATIC: 'static',
  ANIMATED: 'animated',
  SPRITE_SHEET: 'spriteSheet'
};

// Modos de reproducción
export const PlaybackMode = {
  NORMAL: 'normal',
  REVERSE: 'reverse',
  PING_PONG: 'pingPong',
  RANDOM: 'random'
};

// Tipos de transiciones
export const TransitionType = {
  CUT: 'cut',
  FADE: 'fade',
  SLIDE: 'slide',
  WIPE: 'wipe',
  DISSOLVE: 'dissolve',
  ZOOM: 'zoom'
};

// Configuración de cámara cinemática
export const CameraMode = {
  FIXED: 'fixed',
  FOLLOW: 'follow',
  ORBIT: 'orbit',
  PATH: 'path',
  LOOK_AT: 'lookAt',
  SHAKE: 'shake'
};

/**
 * JSDoc Types para mejor autocompletado
 */

/**
 * @typedef {Object} KeyframeConfig
 * @property {number} time - Tiempo del keyframe en ms
 * @property {Object} values - Valores a animar
 * @property {string} [easing] - Tipo de interpolación
 * @property {Function} [onReach] - Callback al alcanzar el keyframe
 */

/**
 * @typedef {Object} TimelineConfig
 * @property {number} [duration] - Duración total en ms
 * @property {boolean} [loop] - Si se repite
 * @property {boolean} [autoPlay] - Si inicia automáticamente
 * @property {KeyframeConfig[]} [keyframes] - Keyframes del timeline
 * @property {Function} [onComplete] - Callback al completar
 */

/**
 * @typedef {Object} CinematicConfig
 * @property {string} id - ID único de la cinemática
 * @property {TimelineConfig[]} timelines - Timelines de la cinemática
 * @property {Object} [audio] - Configuración de audio
 * @property {Object} [camera] - Configuración de cámara
 * @property {Object} [effects] - Efectos visuales
 * @property {boolean} [skippable] - Si se puede saltar
 * @property {Function} [onStart] - Callback al iniciar
 * @property {Function} [onComplete] - Callback al completar
 */

/**
 * @typedef {Object} SpriteConfig
 * @property {string} source - URI de la imagen/sprite sheet
 * @property {number} [frameWidth] - Ancho de cada frame
 * @property {number} [frameHeight] - Alto de cada frame
 * @property {number} [frameCount] - Cantidad de frames
 * @property {number} [fps] - Frames por segundo
 * @property {boolean} [loop] - Si se repite la animación
 */

/**
 * @typedef {Object} EffectConfig
 * @property {string} type - Tipo de efecto
 * @property {number} [duration] - Duración del efecto
 * @property {number} [intensity] - Intensidad (0-1)
 * @property {Object} [params] - Parámetros específicos del efecto
 */

export default {
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
};
