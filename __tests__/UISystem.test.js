/**
 * Tests para UISystem
 * Verifica que el sistema de UI funciona correctamente
 */

import UISystem from '../src/systems/UISystem.js';

describe('UISystem', () => {
  let uiSystem;
  let mockWorld;

  beforeEach(() => {
    // Crear mock del world
    mockWorld = {
      getSystem: jest.fn(),
      getEntitiesWithComponents: jest.fn(() => []),
      createEntity: jest.fn(() => ({
        addComponent: jest.fn(),
        getComponent: jest.fn(),
        removeComponent: jest.fn()
      })),
      removeEntity: jest.fn()
    };

    // Crear instancia del UISystem
    uiSystem = new UISystem();
    uiSystem.world = mockWorld;
  });

  afterEach(() => {
    uiSystem.destroy();
  });

  describe('Inicialización', () => {
    test('debería crear una instancia de UISystem', () => {
      expect(uiSystem).toBeInstanceOf(UISystem);
      expect(uiSystem.name).toBe('UISystem');
    });

    test('debería inicializar con configuración por defecto', () => {
      uiSystem.init(mockWorld);

      expect(uiSystem.screens).toBeInstanceOf(Map);
      expect(uiSystem.uiElements).toBeInstanceOf(Map);
      expect(uiSystem.modalStack).toBeInstanceOf(Array);
      expect(uiSystem.animations).toBeInstanceOf(Map);
    });
  });

  describe('Gestión de Pantallas', () => {
    test('debería crear una nueva pantalla', () => {
      const screen = uiSystem.createScreen('mainMenu', {
        name: 'Main Menu',
        type: 'screen'
      });

      expect(screen).toBeDefined();
      expect(screen.id).toBe('mainMenu');
      expect(screen.name).toBe('Main Menu');
      expect(uiSystem.screens.has('mainMenu')).toBe(true);
    });

    test('debería mostrar una pantalla', () => {
      uiSystem.createScreen('game');
      const result = uiSystem.showScreen('game');

      expect(result).toBe(true);
      expect(uiSystem.activeScreen.id).toBe('game');
      expect(uiSystem.screenStack).toContain('game');
    });

    test('debería ocultar una pantalla', () => {
      uiSystem.createScreen('pause');
      uiSystem.showScreen('pause');
      const result = uiSystem.hideScreen('pause');

      expect(result).toBe(true);
      expect(uiSystem.activeScreen).toBeNull();
    });
  });

  describe('Gestión de Modales', () => {
    test('debería crear un modal', () => {
      const modalElement = {
        id: 'settings',
        entity: mockWorld.createEntity(),
        type: 'modal',
        visible: false,
        enabled: true
      };

      uiSystem.uiElements.set('settings', modalElement);
      const result = uiSystem.showModal('settings');

      expect(result).toBe(true);
      expect(uiSystem.modalStack).toContain('settings');
    });

    test('debería ocultar un modal', () => {
      const modalElement = {
        id: 'confirm',
        entity: mockWorld.createEntity()
      };

      uiSystem.uiElements.set('confirm', modalElement);
      uiSystem.modalStack.push('confirm');

      const result = uiSystem.hideModal('confirm');

      expect(result).toBe(true);
      expect(uiSystem.modalStack).not.toContain('confirm');
    });
  });

  describe('Animaciones', () => {
    test('debería aplicar valores de animación', () => {
      const entity = mockWorld.createEntity();
      entity.getComponent.mockReturnValue({});

      uiSystem._applyAnimationValues(entity, 'opacity', 0.5, 0, 1);

      // Verificar que se creó el componente uiState
      expect(entity.addComponent).toHaveBeenCalledWith(
        'uiState',
        expect.objectContaining({
          opacity: 0.5
        })
      );
    });

    test('debería interpolar posiciones', () => {
      const entity = mockWorld.createEntity();
      entity.getComponent.mockReturnValue({});

      const from = { x: 0, y: 0 };
      const to = { x: 100, y: 100 };

      uiSystem._applyAnimationValues(entity, 'position', 0.5, from, to);

      expect(entity.addComponent).toHaveBeenCalledWith(
        'uiState',
        expect.objectContaining({
          position: { x: 50, y: 50 }
        })
      );
    });

    test('debería aplicar función de easing easeOut', () => {
      const easeOut = uiSystem._easeFunction(0.5, 'easeOut');
      expect(easeOut).toBeCloseTo(0.75, 2); // 1 - (0.5)^2 = 0.75
    });
  });

  describe('Navegación de Focus', () => {
    test('debería enfocar el primer elemento cuando no hay focus', () => {
      // Mock de elementos interactivos
      const mockElement = {
        id: 'button1',
        entity: mockWorld.createEntity(),
        interactive: true,
        visible: true,
        enabled: true
      };

      uiSystem.uiElements.set('button1', mockElement);
      mockWorld.getEntitiesWithComponents.mockReturnValue([mockElement.entity]);

      uiSystem._navigateFocus('right');

      expect(uiSystem.focusedElement).toBe('button1');
    });
  });

  describe('Estadísticas', () => {
    test('debería obtener estadísticas del sistema', () => {
      uiSystem.createScreen('test');
      const stats = uiSystem.getStats();

      expect(stats).toHaveProperty('screens');
      expect(stats).toHaveProperty('elements');
      expect(stats).toHaveProperty('modals');
      expect(stats.screens).toBeGreaterThanOrEqual(1);
    });
  });
});