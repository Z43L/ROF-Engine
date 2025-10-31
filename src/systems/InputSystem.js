/**
 * InputSystem
 * Sistema de input multiplataforma
 * Maneja mouse, teclado, touch y gestos
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';
import Platform from '../utils/Platform.js';

/**
 * InputState - Estado actual del input
 */
class InputState {
  constructor() {
    // Pointer (mouse/touch)
    this.pointer = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      deltaX: 0,
      deltaY: 0,
      isDown: false,
      justPressed: false,
      justReleased: false
    };

    // Touch points (para multi-touch)
    this.touches = [];

    // Teclado
    this.keys = new Map();
    this.keysJustPressed = new Set();
    this.keysJustReleased = new Set();

    // Gestos
    this.gestures = {
      pinchScale: 1,
      pinchVelocity: 0,
      rotation: 0,
      rotationVelocity: 0
    };
  }

  /**
   * Resetea los estados "just" al final del frame
   */
  reset() {
    this.pointer.justPressed = false;
    this.pointer.justReleased = false;
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
  }
}

/**
 * InputSystem
 */
class InputSystem extends System {
  constructor(adapter) {
    super('InputSystem', [], 100); // Prioridad alta
    this.adapter = adapter;
    this.state = new InputState();
    this.emitter = new EventEmitter();

    // Virtual controls
    this.virtualJoystick = null;
    this.virtualButtons = new Map();
  }

  init(world) {
    super.init(world);
    this.adapter.init(this.state, this.emitter);
  }

  update(deltaTime) {
    // Actualizar el adapter
    this.adapter.update(deltaTime);

    // Resetear estados temporales
    this.state.reset();
  }

  // ===== Pointer API =====

  getPointerPosition() {
    return { x: this.state.pointer.x, y: this.state.pointer.y };
  }

  getPointerDelta() {
    return { x: this.state.pointer.deltaX, y: this.state.pointer.deltaY };
  }

  isPointerDown() {
    return this.state.pointer.isDown;
  }

  wasPointerJustPressed() {
    return this.state.pointer.justPressed;
  }

  wasPointerJustReleased() {
    return this.state.pointer.justReleased;
  }

  // ===== Keyboard API =====

  isKeyDown(key) {
    return this.state.keys.get(key) || false;
  }

  wasKeyJustPressed(key) {
    return this.state.keysJustPressed.has(key);
  }

  wasKeyJustReleased(key) {
    return this.state.keysJustReleased.has(key);
  }

  // ===== Touch API =====

  getTouches() {
    return this.state.touches;
  }

  getTouchCount() {
    return this.state.touches.length;
  }

  // ===== Gesture API =====

  getPinchScale() {
    return this.state.gestures.pinchScale;
  }

  getRotation() {
    return this.state.gestures.rotation;
  }

  // ===== Virtual Controls =====

  /**
   * Crea un joystick virtual
   */
  createVirtualJoystick(config = {}) {
    this.virtualJoystick = {
      x: 0,
      y: 0,
      angle: 0,
      distance: 0,
      maxDistance: config.maxDistance || 100,
      deadzone: config.deadzone || 0.1,
      visible: config.visible !== false,
      position: config.position || { x: 100, y: 100 }
    };
    return this.virtualJoystick;
  }

  /**
   * Obtiene el estado del joystick virtual
   */
  getVirtualJoystick() {
    return this.virtualJoystick;
  }

  /**
   * Crea un botón virtual
   */
  createVirtualButton(id, config = {}) {
    this.virtualButtons.set(id, {
      id,
      isDown: false,
      justPressed: false,
      justReleased: false,
      position: config.position || { x: 0, y: 0 },
      radius: config.radius || 50,
      visible: config.visible !== false
    });
  }

  /**
   * Obtiene el estado de un botón virtual
   */
  getVirtualButton(id) {
    return this.virtualButtons.get(id);
  }

  // ===== Event Listeners =====

  /**
   * Escucha eventos de input
   */
  on(event, callback) {
    return this.emitter.on(event, callback);
  }

  off(event, callback) {
    this.emitter.off(event, callback);
  }

  /**
   * Eventos disponibles:
   * - 'pointerDown', 'pointerUp', 'pointerMove'
   * - 'keyDown', 'keyUp'
   * - 'touchStart', 'touchMove', 'touchEnd'
   * - 'pinch', 'rotate', 'swipe'
   */

  destroy() {
    super.destroy();
    this.adapter.destroy();
    this.emitter.removeAllListeners();
  }
}

export default InputSystem;
export { InputState };
