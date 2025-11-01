/**
 * Tests para InputSystem
 * Verifica que el sistema de input funciona correctamente
 */

import InputSystem from '../src/systems/InputSystem.js';
import InputState from '../src/systems/InputSystem.js';

describe('InputSystem', () => {
  let inputSystem;
  let mockAdapter;
  let mockWorld;

  beforeEach(() => {
    // Crear mock del adapter
    mockAdapter = {
      init: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    };

    // Crear mock del world
    mockWorld = {
      getSystem: jest.fn()
    };

    // Crear instancia del InputSystem
    inputSystem = new InputSystem(mockAdapter);
    inputSystem.world = mockWorld;
  });

  afterEach(() => {
    inputSystem.destroy();
  });

  describe('Inicialización', () => {
    test('debería crear una instancia de InputSystem', () => {
      expect(inputSystem).toBeInstanceOf(InputSystem);
      expect(inputSystem.name).toBe('InputSystem');
    });

    test('debería inicializar con el adapter', () => {
      inputSystem.init(mockWorld);

      expect(mockAdapter.init).toHaveBeenCalledWith(
        inputSystem.state,
        inputSystem.emitter
      );
    });
  });

  describe('Estado del Input', () => {
    test('debería inicializar con estado por defecto', () => {
      const state = new InputState();

      expect(state.pointer.x).toBe(0);
      expect(state.pointer.y).toBe(0);
      expect(state.pointer.isDown).toBe(false);
      expect(state.pointer.justPressed).toBe(false);
      expect(state.pointer.justReleased).toBe(false);
      expect(state.keys.size).toBe(0);
      expect(state.touches).toEqual([]);
    });

    test('debería resetear estados temporales', () => {
      inputSystem.state.pointer.justPressed = true;
      inputSystem.state.keysJustPressed.add('space');
      inputSystem.state.keysJustReleased.add('enter');

      inputSystem.state.reset();

      expect(inputSystem.state.pointer.justPressed).toBe(false);
      expect(inputSystem.state.keysJustPressed.size).toBe(0);
      expect(inputSystem.state.keysJustReleased.size).toBe(0);
    });
  });

  describe('APIs de Pointer', () => {
    test('debería obtener posición del pointer', () => {
      inputSystem.state.pointer.x = 100;
      inputSystem.state.pointer.y = 200;

      const position = inputSystem.getPointerPosition();

      expect(position).toEqual({ x: 100, y: 200 });
    });

    test('debería detectar cuando el pointer está presionado', () => {
      inputSystem.state.pointer.isDown = true;

      expect(inputSystem.isPointerDown()).toBe(true);
    });

    test('debería detectar presión just-in-time', () => {
      inputSystem.state.pointer.justPressed = true;

      expect(inputSystem.wasPointerJustPressed()).toBe(true);
    });
  });

  describe('APIs de Keyboard', () => {
    test('debería detectar teclas presionadas', () => {
      inputSystem.state.keys.set('space', true);
      inputSystem.state.keys.set('enter', false);

      expect(inputSystem.isKeyDown('space')).toBe(true);
      expect(inputSystem.isKeyDown('enter')).toBe(false);
    });

    test('debería detectar teclas just-pressed', () => {
      inputSystem.state.keysJustPressed.add('space');

      expect(inputSystem.wasKeyJustPressed('space')).toBe(true);
      expect(inputSystem.wasKeyJustPressed('enter')).toBe(false);
    });
  });

  describe('APIs de Touch', () => {
    test('debería obtener touch points', () => {
      const touches = [
        { id: 0, x: 100, y: 100 },
        { id: 1, x: 200, y: 200 }
      ];

      inputSystem.state.touches = touches;

      expect(inputSystem.getTouches()).toEqual(touches);
      expect(inputSystem.getTouchCount()).toBe(2);
    });
  });

  describe('APIs de Gestos', () => {
    test('debería obtener pinch scale', () => {
      inputSystem.state.gestures.pinchScale = 1.5;

      expect(inputSystem.getPinchScale()).toBe(1.5);
    });

    test('debería obtener rotación', () => {
      inputSystem.state.gestures.rotation = 45;

      expect(inputSystem.getRotation()).toBe(45);
    });
  });

  describe('Controles Virtuales', () => {
    test('debería crear un joystick virtual', () => {
      const config = {
        maxDistance: 100,
        deadzone: 0.1,
        position: { x: 50, y: 50 }
      };

      const joystick = inputSystem.createVirtualJoystick(config);

      expect(joystick).toBeDefined();
      expect(joystick.maxDistance).toBe(100);
      expect(joystick.deadzone).toBe(0.1);
      expect(inputSystem.virtualJoystick).toBe(joystick);
    });

    test('debería obtener el joystick virtual', () => {
      inputSystem.virtualJoystick = { x: 1, y: 0 };

      const joystick = inputSystem.getVirtualJoystick();

      expect(joystick).toEqual({ x: 1, y: 0 });
    });

    test('debería crear un botón virtual', () => {
      const config = {
        position: { x: 100, y: 100 },
        radius: 50
      };

      inputSystem.createVirtualButton('jump', config);

      const button = inputSystem.getVirtualButton('jump');

      expect(button).toBeDefined();
      expect(button.id).toBe('jump');
      expect(button.position).toEqual({ x: 100, y: 100 });
      expect(button.radius).toBe(50);
    });
  });

  describe('Event Listeners', () => {
    test('debería registrar event listeners', () => {
      const callback = jest.fn();
      const off = inputSystem.on('pointerDown', callback);

      expect(off).toBeDefined();
    });

    test('debería remover event listeners', () => {
      const callback = jest.fn();
      inputSystem.on('keyDown', callback);
      inputSystem.off('keyDown', callback);

      // Verificar que se removió (esto depende de la implementación del EventEmitter)
      expect(inputSystem.emitter.events['keyDown']).toBeUndefined();
    });
  });

  describe('Actualización', () => {
    test('debería actualizarse en cada frame', () => {
      const deltaTime = 1 / 60;

      inputSystem.update(deltaTime);

      expect(mockAdapter.update).toHaveBeenCalledWith(deltaTime);
    });
  });

  describe('Cleanup', () => {
    test('debería limpiar recursos al destruir', () => {
      inputSystem.destroy();

      expect(mockAdapter.destroy).toHaveBeenCalled();
    });
  });
});