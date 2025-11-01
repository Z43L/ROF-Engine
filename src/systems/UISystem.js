/**
 * UISystem
 * Sistema de UI para juegos
 * Maneja HUD, menús, diálogos, tooltips y elementos de interfaz
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';

/**
 * UISystem - Sistema de interfaz de usuario
 */
class UISystem extends System {
  constructor() {
    super('UISystem', ['ui'], 20); // Prioridad media

    this.emitter = new EventEmitter();

    // Gestión de pantallas/states
    this.screens = new Map(); // screenId -> screen data
    this.activeScreen = null;
    this.screenStack = []; // Para navegación

    // Gestión de UI elementos
    this.uiElements = new Map(); // elementId -> element
    this.modalStack = []; // Pila de modales

    // Input UI
    this.focusedElement = null;
    this.navigationEnabled = true;

    // Animaciones
    this.animations = new Map();
    this.transitionQueue = [];

    // Estadísticas
    this.stats = {
      screens: 0,
      elements: 0,
      modals: 0
    };
  }

  init(world) {
    super.init(world);
    this._setupEventListeners();
  }

  /**
   * Registra una entidad con UI
   */
  onEntityAdded(entity) {
    const ui = entity.getComponent('ui');
    if (!ui) return;

    // Crear elemento UI
    const uiElement = {
      id: ui.id || this._generateId(),
      entity,
      type: ui.type || 'element',
      screen: ui.screen || null,
      visible: ui.visible !== false,
      enabled: ui.enabled !== false,
      interactive: ui.interactive !== false,
      focusable: ui.focusable || false,
      data: ui.data || {},
      animations: ui.animations || {},
      callbacks: ui.callbacks || {},
      children: [],
      parent: null
    };

    this.uiElements.set(uiElement.id, uiElement);

    // Si pertenece a una screen
    if (ui.screen) {
      this._addToScreen(uiElement);
    }

    // Si es un modal
    if (ui.isModal) {
      this._addModal(uiElement);
    }

    this.stats.elements++;
  }

  /**
   * Elimina una entidad UI
   */
  onEntityRemoved(entity) {
    const ui = entity.getComponent('ui');
    if (!ui) return;

    const uiElement = this.uiElements.get(ui.id);
    if (!uiElement) return;

    // Remover de screen si existe
    if (uiElement.screen) {
      this._removeFromScreen(uiElement);
    }

    // Remover modal si existe
    if (ui.isModal) {
      this._removeModal(uiElement);
    }

    // Limpiar animaciones
    this.animations.delete(uiElement.id);

    this.uiElements.delete(uiElement.id);
    this.stats.elements--;
  }

  /**
   * Crea una nueva pantalla
   */
  createScreen(screenId, config = {}) {
    if (this.screens.has(screenId)) {
      console.warn(`Screen '${screenId}' already exists`);
      return this.screens.get(screenId);
    }

    const screen = {
      id: screenId,
      name: config.name || screenId,
      type: config.type || 'screen', // screen, modal, overlay
      visible: false,
      enabled: false,
      interactive: config.interactive !== false,
      elements: new Set(),
      transitions: config.transitions || {},
      zIndex: config.zIndex || 0,
      data: config.data || {}
    };

    this.screens.set(screenId, screen);
    this.stats.screens++;

    this.emitter.emit('screenCreated', { screenId, screen });

    return screen;
  }

  /**
   * Muestra una pantalla
   */
  showScreen(screenId, transition = 'fade') {
    const screen = this.screens.get(screenId);
    if (!screen) {
      console.warn(`Screen '${screenId}' not found`);
      return false;
    }

    // Ocultar screen actual si es necesario
    if (this.activeScreen && this.activeScreen.id !== screenId) {
      this._hideScreen(this.activeScreen.id, 'none');
    }

    // Mostrar nueva screen
    screen.visible = true;
    screen.enabled = true;
    this.activeScreen = screen;
    this.screenStack.push(screenId);

    // Aplicar transición
    this._applyTransition(screen, transition, 'show');

    this.emitter.emit('screenShown', { screenId, screen });

    return true;
  }

  /**
   * Oculta una pantalla
   */
  hideScreen(screenId, transition = 'fade') {
    const screen = this.screens.get(screenId);
    if (!screen) return false;

    screen.visible = false;
    screen.enabled = false;

    // Remover de stack
    const index = this.screenStack.indexOf(screenId);
    if (index > -1) {
      this.screenStack.splice(index, 1);
    }

    // Si era la active screen, cambiar
    if (this.activeScreen && this.activeScreen.id === screenId) {
      this.activeScreen = this.screenStack.length > 0
        ? this.screens.get(this.screenStack[this.screenStack.length - 1])
        : null;
    }

    // Aplicar transición
    this._applyTransition(screen, transition, 'hide');

    this.emitter.emit('screenHidden', { screenId, screen });

    return true;
  }

  /**
   * Navega entre pantallas (con history)
   */
  navigateTo(screenId, transition = 'slideLeft') {
    return this.showScreen(screenId, transition);
  }

  /**
   * Navega hacia atrás en el history
   */
  navigateBack(transition = 'slideRight') {
    if (this.screenStack.length < 2) return false;

    const currentScreenId = this.screenStack.pop();
    const previousScreenId = this.screenStack[this.screenStack.length - 1];

    this.hideScreen(currentScreenId, 'none'); // Sin transición para current
    return this.showScreen(previousScreenId, transition);
  }

  /**
   * Muestra un modal
   */
  showModal(elementId, overlay = true) {
    const element = this.uiElements.get(elementId);
    if (!element) return false;

    // Crear overlay si es necesario
    if (overlay && !this._hasOverlay()) {
      this._createOverlay();
    }

    element.visible = true;
    element.interactive = true;

    this.modalStack.push(elementId);
    this.stats.modals = this.modalStack.length;

    this._animateElement(element, 'modalShow');

    this.emitter.emit('modalShown', { elementId, element });

    return true;
  }

  /**
   * Oculta un modal
   */
  hideModal(elementId) {
    const element = this.uiElements.get(elementId);
    if (!element) return false;

    element.visible = false;
    element.interactive = false;

    // Remover de stack
    const index = this.modalStack.indexOf(elementId);
    if (index > -1) {
      this.modalStack.splice(index, 1);
    }
    this.stats.modals = this.modalStack.length;

    // Remover overlay si no hay más modales
    if (this.modalStack.length === 0) {
      this._removeOverlay();
    }

    this._animateElement(element, 'modalHide');

    this.emitter.emit('modalHidden', { elementId, element });

    return true;
  }

  /**
   * Foca un elemento
   */
  focusElement(elementId) {
    const element = this.uiElements.get(elementId);
    if (!element || !element.focusable || !element.enabled) return false;

    // Remover focus del anterior
    if (this.focusedElement) {
      this._unfocusElement(this.focusedElement);
    }

    this.focusedElement = elementId;
    this._animateElement(element, 'focus');

    this.emitter.emit('elementFocused', { elementId, element });

    return true;
  }

  /**
   * Desfoca el elemento actual
   */
  blurElement() {
    if (!this.focusedElement) return;

    const element = this.uiElements.get(this.focusedElement);
    if (element) {
      this._animateElement(element, 'blur');
      this.emitter.emit('elementBlurred', { elementId: this.focusedElement, element });
    }

    this.focusedElement = null;
  }

  /**
   * Actualiza el sistema UI
   */
  update(deltaTime) {
    // Actualizar animaciones
    this._updateAnimations(deltaTime);

    // Procesar transiciones en cola
    this._processTransitions();

    // Actualizar navegación por input
    if (this.navigationEnabled && this.focusedElement) {
      this._updateNavigation();
    }

    // Actualizar elementos
    this.uiElements.forEach((element) => {
      if (element.enabled && element.visible) {
        this._updateElement(element, deltaTime);
      }
    });
  }

  /**
   * Actualiza una animación específica
   */
  _updateAnimations(deltaTime) {
    const now = Date.now();

    this.animations.forEach((animation, animationId) => {
      // Calcular tiempo transcurrido
      const elapsed = now - animation.startTime;
      animation.elapsed = elapsed;

      const progress = Math.min(elapsed / animation.duration, 1);
      const easedProgress = this._easeFunction(progress, animation.easing);

      // Aplicar valores animados
      const elementId = animationId.split('_')[0];
      const element = this.uiElements.get(elementId);
      if (element && element.entity) {
        this._applyAnimationValues(element.entity, animation.property, easedProgress, animation.from, animation.to);
      }

      // Completar animación
      if (progress >= 1) {
        if (animation.onComplete) {
          animation.onComplete();
        }
        this.animations.delete(animationId);
      }
    });
  }

  /**
   * Aplica valores de animación
   */
  _applyAnimationValues(entity, property, progress, from, to) {
    const value = from + (to - from) * progress;

    // Obtener o crear el UI state del componente
    let uiState = entity.getComponent('uiState');
    if (!uiState) {
      uiState = {
        opacity: 1,
        scale: { x: 1, y: 1 },
        position: { x: 0, y: 0 },
        rotation: 0,
        ...entity.getComponent('transform')
      };
      entity.addComponent('uiState', uiState);
    }

    // Aplicar según la propiedad
    switch (property) {
      case 'opacity':
        uiState.opacity = value;
        break;
      case 'scaleX':
        uiState.scale.x = value;
        break;
      case 'scaleY':
        uiState.scale.y = value;
        break;
      case 'scale':
        uiState.scale = { x: value, y: value };
        break;
      case 'positionX':
        uiState.position.x = value;
        break;
      case 'positionY':
        uiState.position.y = value;
        break;
      case 'rotation':
        uiState.rotation = value;
        break;
      case 'position':
        // Interpolar posición (requiere from/to como objetos)
        if (typeof from === 'object' && typeof to === 'object') {
          uiState.position = {
            x: from.x + (to.x - from.x) * progress,
            y: from.y + (to.y - from.y) * progress
          };
        }
        break;
    }

    // Actualizar el componente transform si existe
    const transform = entity.getComponent('transform');
    if (transform) {
      transform.opacity = uiState.opacity;
      transform.scaleX = uiState.scale.x;
      transform.scaleY = uiState.scale.y;
      transform.rotation = uiState.rotation;
    }
  }

  /**
   * Función de easing básica
   */
  _easeFunction(progress, easing = 'linear') {
    switch (easing) {
      case 'easeIn':
        return progress * progress;
      case 'easeOut':
        return 1 - (1 - progress) * (1 - progress);
      case 'easeInOut':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - 2 * (1 - progress) * (1 - progress);
      default:
        return progress; // linear
    }
  }

  /**
   * Animar un elemento
   */
  _animateElement(element, animationType) {
    const animation = element.animations[animationType];
    if (!animation) return;

    // Crear animación
    this.animations.set(element.id, {
      property: animation.property || 'opacity',
      from: animation.from || 0,
      to: animation.to || 1,
      duration: animation.duration || 300,
      easing: animation.easing || 'easeOut',
      elapsed: 0,
      onComplete: animation.onComplete
    });
  }

  /**
   * Aplica transición a una pantalla
   */
  _applyTransition(screen, transition, direction) {
    // Implementación básica de transiciones
    // Se puede extender con animaciones más complejas
    switch (transition) {
      case 'fade':
        this._transitionFade(screen, direction);
        break;
      case 'slideLeft':
        this._transitionSlide(screen, direction, 'left');
        break;
      case 'slideRight':
        this._transitionSlide(screen, direction, 'right');
        break;
      case 'scale':
        this._transitionScale(screen, direction);
        break;
      default:
        // Sin transición
        break;
    }
  }

  /**
   * Transición de fade
   */
  _transitionFade(screen, direction) {
    screen.elements.forEach((elementId) => {
      const element = this.uiElements.get(elementId);
      if (element) {
        this._animateElement(element, direction === 'show' ? 'fadeIn' : 'fadeOut');
      }
    });
  }

  /**
   * Transición de slide
   */
  _transitionSlide(screen, direction, side) {
    const elements = Array.from(screen.elements);
    const screenWidth = 1920; // Debería venir de configuración
    const distance = screenWidth; // Slide desde fuera de pantalla

    elements.forEach((elementId, index) => {
      const element = this.uiElements.get(elementId);
      if (!element) return;

      const delay = index * 50; // Stagger animation

      if (direction === 'show') {
        // Slide in
        const fromPos = this._getSlideFromPosition(side, distance);
        const toPos = { x: 0, y: 0 };

        // Establecer posición inicial
        this._setInitialPosition(element, fromPos);

        // Animar a posición final
        setTimeout(() => {
          this._animateElementTo(element, 'position', fromPos, toPos, 300, 'easeOut');
        }, delay);

      } else {
        // Slide out
        const fromPos = { x: 0, y: 0 };
        const toPos = this._getSlideToPosition(side, distance);

        // Animar fuera de pantalla
        setTimeout(() => {
          this._animateElementTo(element, 'position', fromPos, toPos, 300, 'easeIn');
        }, delay);
      }
    });
  }

  /**
   * Transición de scale
   */
  _transitionScale(screen, direction) {
    const elements = Array.from(screen.elements);

    elements.forEach((elementId, index) => {
      const element = this.uiElements.get(elementId);
      if (!element) return;

      const delay = index * 30;

      if (direction === 'show') {
        // Scale from 0 to 1
        this._animateElementTo(element, 'scale', 0, 1, 400, 'easeOut', delay);
        // Fade in
        this._animateElementTo(element, 'opacity', 0, 1, 400, 'easeOut', delay);

      } else {
        // Scale from 1 to 0
        this._animateElementTo(element, 'scale', 1, 0, 300, 'easeIn', delay);
        // Fade out
        this._animateElementTo(element, 'opacity', 1, 0, 300, 'easeIn', delay);
      }
    });
  }

  /**
   * Obtiene posición inicial para slide según dirección
   */
  _getSlideFromPosition(side, distance) {
    switch (side) {
      case 'left':
        return { x: -distance, y: 0 };
      case 'right':
        return { x: distance, y: 0 };
      case 'up':
        return { x: 0, y: -distance };
      case 'down':
        return { x: 0, y: distance };
      default:
        return { x: distance, y: 0 };
    }
  }

  /**
   * Obtiene posición final para slide según dirección
   */
  _getSlideToPosition(side, distance) {
    switch (side) {
      case 'left':
        return { x: -distance, y: 0 };
      case 'right':
        return { x: distance, y: 0 };
      case 'up':
        return { x: 0, y: -distance };
      case 'down':
        return { x: 0, y: distance };
      default:
        return { x: distance, y: 0 };
    }
  }

  /**
   * Establece posición inicial de un elemento
   */
  _setInitialPosition(element, position) {
    const uiState = element.entity.getComponent('uiState') || {};
    uiState.position = position;
    element.entity.addComponent('uiState', uiState);
  }

  /**
   * Anima elemento a una posición/valor específico
   */
  _animateElementTo(element, property, from, to, duration = 300, easing = 'easeOut', delay = 0) {
    setTimeout(() => {
      this.animations.set(element.id + '_' + property, {
        property,
        from,
        to,
        duration,
        easing,
        elapsed: 0,
        startTime: Date.now()
      });
    }, delay);
  }

  /**
   * Actualiza navegación por teclado/gamepad
   */
  _updateNavigation() {
    // Obtener input system
    const inputSystem = this.world.getSystem('InputSystem');
    if (!inputSystem) return;

    // Navegación básica con flechas
    if (inputSystem.wasKeyJustPressed('arrowleft')) {
      this._navigateFocus('left');
    } else if (inputSystem.wasKeyJustPressed('arrowright')) {
      this._navigateFocus('right');
    } else if (inputSystem.wasKeyJustPressed('arrowup')) {
      this._navigateFocus('up');
    } else if (inputSystem.wasKeyJustPressed('arrowdown')) {
      this._navigateFocus('down');
    }
  }

  /**
   * Navega el focus en una dirección
   */
  _navigateFocus(direction) {
    if (!this.focusedElement) {
      // Si no hay focus, enfocar el primer elemento interactivo
      const interactiveElements = this.getInteractiveElements();
      if (interactiveElements.length > 0) {
        this.focusElement(interactiveElements[0].id);
      }
      return;
    }

    const currentElement = this.uiElements.get(this.focusedElement);
    if (!currentElement) return;

    const interactiveElements = this.getInteractiveElements(currentElement.screen);
    const currentIndex = interactiveElements.findIndex(el => el.id === this.focusedElement);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    // Lógica básica: moverse al elemento más cercano en la dirección
    const currentPos = this._getElementPosition(currentElement);
    let bestDistance = Infinity;

    for (let i = 0; i < interactiveElements.length; i++) {
      if (i === currentIndex) continue;

      const candidate = interactiveElements[i];
      const candidatePos = this._getElementPosition(candidate);

      const distance = this._calculateDistance(currentPos, candidatePos, direction);
      if (distance < bestDistance && this._isInDirection(currentPos, candidatePos, direction)) {
        bestDistance = distance;
        nextIndex = i;
      }
    }

    // Si no se encuentra uno en esa dirección, usar navegación circular
    if (bestDistance === Infinity) {
      switch (direction) {
        case 'left':
        case 'up':
          nextIndex = currentIndex > 0 ? currentIndex - 1 : interactiveElements.length - 1;
          break;
        case 'right':
        case 'down':
          nextIndex = currentIndex < interactiveElements.length - 1 ? currentIndex + 1 : 0;
          break;
      }
    }

    if (nextIndex !== currentIndex) {
      this.focusElement(interactiveElements[nextIndex].id);
    }
  }

  /**
   * Obtiene la posición de un elemento
   */
  _getElementPosition(element) {
    const transform = element.entity.getComponent('transform');
    const uiState = element.entity.getComponent('uiState');

    if (uiState && uiState.position) {
      return uiState.position;
    }

    return {
      x: transform?.x || 0,
      y: transform?.y || 0
    };
  }

  /**
   * Calcula distancia en una dirección específica
   */
  _calculateDistance(pos1, pos2, direction) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;

    switch (direction) {
      case 'left':
        return pos1.x - pos2.x > 0 ? dx * dx : Infinity;
      case 'right':
        return pos2.x - pos1.x > 0 ? dx * dx : Infinity;
      case 'up':
        return pos1.y - pos2.y > 0 ? dy * dy : Infinity;
      case 'down':
        return pos2.y - pos1.y > 0 ? dy * dy : Infinity;
      default:
        return Math.sqrt(dx * dx + dy * dy);
    }
  }

  /**
   * Verifica si el candidato está en la dirección especificada
   */
  _isInDirection(pos1, pos2, direction) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const threshold = 50; // Tolerancia para considerar "en esa dirección"

    switch (direction) {
      case 'left':
        return dx < -threshold;
      case 'right':
        return dx > threshold;
      case 'up':
        return dy < -threshold;
      case 'down':
        return dy > threshold;
      default:
        return true;
    }
  }

  /**
   * Obtiene elementos de una screen
   */
  getScreenElements(screenId) {
    const screen = this.screens.get(screenId);
    return screen ? Array.from(screen.elements) : [];
  }

  /**
   * Obtiene elementos interactivos
   */
  getInteractiveElements(screenId = null) {
    let elements = Array.from(this.uiElements.values());

    if (screenId) {
      const screen = this.screens.get(screenId);
      if (screen) {
        elements = elements.filter(el => screen.elements.has(el.id));
      }
    }

    return elements.filter(el => el.interactive && el.visible && el.enabled);
  }

  /**
   * Event listeners
   */
  on(event, callback) {
    return this.emitter.on(event, callback);
  }

  off(event, callback) {
    this.emitter.off(event, callback);
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    return {
      ...this.stats,
      activeScreen: this.activeScreen?.id || null,
      focusedElement: this.focusedElement,
      modalStack: [...this.modalStack]
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    // Limpiar screens
    this.screens.clear();
    this.screenStack = [];

    // Limpiar elementos
    this.uiElements.clear();
    this.modalStack = [];

    // Limpiar animaciones
    this.animations.clear();

    this.emitter.removeAllListeners();

    super.destroy();
  }

  // Métodos privados

  _generateId() {
    return 'ui_' + Math.random().toString(36).substr(2, 9);
  }

  _setupEventListeners() {
    // Configurar event listeners globales
  }

  _addToScreen(element) {
    const screen = this.screens.get(element.screen);
    if (screen) {
      screen.elements.add(element.id);
      element.screen = screen.id;
    }
  }

  _removeFromScreen(element) {
    const screen = this.screens.get(element.screen);
    if (screen) {
      screen.elements.delete(element.id);
    }
  }

  _addModal(element) {
    if (!this.modalStack.includes(element.id)) {
      this.modalStack.push(element.id);
    }
  }

  _removeModal(element) {
    const index = this.modalStack.indexOf(element.id);
    if (index > -1) {
      this.modalStack.splice(index, 1);
    }
  }

  _hasOverlay() {
    return this.uiElements.has('__overlay__');
  }

  _createOverlay() {
    // Crear elemento overlay
    const overlayElement = {
      id: '__overlay__',
      entity: null, // Se asocia a una entidad más tarde
      type: 'overlay',
      screen: null,
      visible: false,
      enabled: true,
      interactive: true,
      focusable: false,
      data: {
        color: 'black',
        opacity: 0.5,
        zIndex: 9999
      },
      animations: {
        fadeIn: {
          property: 'opacity',
          from: 0,
          to: 0.5,
          duration: 300,
          easing: 'easeOut'
        },
        fadeOut: {
          property: 'opacity',
          from: 0.5,
          to: 0,
          duration: 300,
          easing: 'easeIn'
        }
      },
      callbacks: {
        onClick: () => {
          // Cerrar el último modal al hacer click en el overlay
          if (this.modalStack.length > 0) {
            const topModalId = this.modalStack[this.modalStack.length - 1];
            this.hideModal(topModalId);
          }
        }
      }
    };

    this.uiElements.set('__overlay__', overlayElement);

    // Mostrar con animación
    this._animateElement(overlayElement, 'fadeIn');

    console.log('✅ UI Overlay created');
  }

  _removeOverlay() {
    const overlayElement = this.uiElements.get('__overlay__');
    if (!overlayElement) return;

    // Animar fade out
    this._animateElement(overlayElement, 'fadeOut');

    // Remover después de la animación
    setTimeout(() => {
      this.uiElements.delete('__overlay__');
      console.log('🗑️ UI Overlay removed');
    }, 300);
  }

  _updateElement(element, deltaTime) {
    // Actualizaciones específicas por tipo de elemento
    switch (element.type) {
      case 'button':
        // Actualizar estado visual del botón basado en interacción
        this._updateButton(element, deltaTime);
        break;
      case 'text':
        // Actualizar scroll o efectos de texto
        this._updateText(element, deltaTime);
        break;
      case 'image':
        // Actualizar animaciones de imagen
        this._updateImage(element, deltaTime);
        break;
      case 'slider':
        // Actualizar valor del slider
        this._updateSlider(element, deltaTime);
        break;
      default:
        // Actualización genérica
        break;
    }
  }

  _updateButton(element, deltaTime) {
    // El botón responde a input y cambia visualmente
    const inputSystem = this.world.getSystem('InputSystem');
    if (!inputSystem) return;

    const transform = element.entity.getComponent('transform');
    const uiState = element.entity.getComponent('uiState') || {};

    const pointer = inputSystem.getPointerPosition();
    const isHovering = this._isPointInElement(pointer, element);

    if (isHovering && inputSystem.isPointerDown()) {
      // Presionado
      uiState.scale = { x: 0.95, y: 0.95 };
    } else if (isHovering) {
      // Hover
      uiState.scale = { x: 1.05, y: 1.05 };
    } else {
      // Normal
      uiState.scale = { x: 1, y: 1 };
    }

    element.entity.addComponent('uiState', uiState);
  }

  _updateText(element, deltaTime) {
    // Lógica de actualización de texto
  }

  _updateImage(element, deltaTime) {
    // Lógica de actualización de imagen
  }

  _updateSlider(element, deltaTime) {
    // Lógica de actualización de slider
  }

  _processTransitions() {
    // Procesar cola de transiciones si existe
    if (this.transitionQueue.length > 0) {
      // Implementar sistema de cola si es necesario
    }
  }

  _focusElement(elementId) {
    // Aplicar efectos de focus
    const element = this.uiElements.get(elementId);
    if (!element) return;

    const uiState = element.entity.getComponent('uiState') || {};
    uiState.scale = { x: (uiState.scale?.x || 1) * 1.1, y: (uiState.scale?.y || 1) * 1.1 };

    element.entity.addComponent('uiState', uiState);
  }

  _unfocusElement(elementId) {
    // Quitar efectos de focus
    const element = this.uiElements.get(elementId);
    if (!element) return;

    const uiState = element.entity.getComponent('uiState') || {};
    uiState.scale = { x: (uiState.scale?.x || 1) / 1.1, y: (uiState.scale?.y || 1) / 1.1 };

    element.entity.addComponent('uiState', uiState);
  }

  /**
   * Verifica si un punto está dentro de un elemento
   */
  _isPointInElement(point, element) {
    const transform = element.entity.getComponent('transform');
    const uiState = element.entity.getComponent('uiState');

    const pos = uiState?.position || { x: transform?.x || 0, y: transform?.y || 0 };
    const size = element.data?.size || { width: 100, height: 50 };

    return (
      point.x >= pos.x - size.width / 2 &&
      point.x <= pos.x + size.width / 2 &&
      point.y >= pos.y - size.height / 2 &&
      point.y <= pos.y + size.height / 2
    );
  }
}

export default UISystem;
