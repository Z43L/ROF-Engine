/**
 * UI Component
 * Componente base para elementos de UI
 */

import { ComponentRegistry } from '../../core/Component.js';

/**
 * Tipos de elementos UI
 */
export const UIElementType = {
  SCREEN: 'screen',
  CONTAINER: 'container',
  BUTTON: 'button',
  TEXT: 'text',
  IMAGE: 'image',
  INPUT: 'input',
  SLIDER: 'slider',
  PROGRESS_BAR: 'progressBar',
  MODAL: 'modal',
  TOOLTIP: 'tooltip',
  HUD: 'hud'
};

/**
 * Estados de UI
 */
export const UIState = {
  NORMAL: 'normal',
  HOVER: 'hover',
  PRESSED: 'pressed',
  DISABLED: 'disabled',
  FOCUSED: 'focused'
};

/**
 * Crea un componente UI básico
 */
export function createUIComponent(options = {}) {
  return ComponentRegistry.create('ui', {
    id: options.id || generateUIId(),
    type: options.type || UIElementType.CONTAINER,
    screen: options.screen || null,
    parent: options.parent || null,

    // Visibilidad y estado
    visible: options.visible !== false,
    enabled: options.enabled !== false,
    interactive: options.interactive !== false,
    focusable: options.focusable || false,

    // Posición y tamaño
    position: options.position || { x: 0, y: 0 },
    size: options.size || { width: 100, height: 50 },
    anchor: options.anchor || 'topLeft', // topLeft, topCenter, topRight, center, etc.
    pivot: options.pivot || { x: 0, y: 0 }, // 0-1, punto de referencia

    // Apariencia
    backgroundColor: options.backgroundColor || 'transparent',
    borderColor: options.borderColor || 'transparent',
    borderWidth: options.borderWidth || 0,
    borderRadius: options.borderRadius || 0,
    opacity: options.opacity || 1,
    scale: options.scale || { x: 1, y: 1 },
    rotation: options.rotation || 0,
    zIndex: options.zIndex || 0,

    // Contenido
    text: options.text || '',
    textColor: options.textColor || '#ffffff',
    textSize: options.textSize || 16,
    textAlign: options.textAlign || 'left', // left, center, right
    fontFamily: options.fontFamily || 'system',
    image: options.image || null,

    // Estados visuales
    states: {
      normal: {
        backgroundColor: options.backgroundColor || 'transparent',
        textColor: options.textColor || '#ffffff',
        opacity: options.opacity || 1
      },
      hover: options.hover || null,
      pressed: options.pressed || null,
      disabled: options.disabled || null
    },

    // Animaciones
    animations: {
      fadeIn: options.fadeIn || null,
      fadeOut: options.fadeOut || null,
      scaleIn: options.scaleIn || null,
      scaleOut: options.scaleOut || null,
      modalShow: options.modalShow || null,
      modalHide: options.modalHide || null,
      focus: options.focus || null,
      blur: options.blur || null
    },

    // Eventos y callbacks
    callbacks: {
      onClick: options.onClick || null,
      onHover: options.onHover || null,
      onFocus: options.onFocus || null,
      onBlur: options.onBlur || null,
      onInput: options.onInput || null,
      onShow: options.onShow || null,
      onHide: options.onHide || null
    },

    // Flags especiales
    isModal: options.isModal || false,
    preserveAspect: options.preserveAspect || false,
    clipping: options.clipping || false,
    ...options
  });
}

/**
 * Crea un botón
 */
export function createButton(options = {}) {
  return createUIComponent({
    type: UIElementType.BUTTON,
    interactive: true,
    focusable: true,
    text: options.text || 'Button',
    size: options.size || { width: 120, height: 40 },
    backgroundColor: options.backgroundColor || '#333333',
    textColor: options.textColor || '#ffffff',

    // Estados del botón
    hover: {
      backgroundColor: options.hoverBackgroundColor || '#444444',
      scale: { x: 1.05, y: 1.05 }
    },
    pressed: {
      backgroundColor: options.pressedBackgroundColor || '#222222',
      scale: { x: 0.95, y: 0.95 }
    },
    disabled: {
      backgroundColor: options.disabledBackgroundColor || '#555555',
      textColor: options.disabledTextColor || '#888888',
      opacity: 0.5
    },

    // Animaciones
    hover: {
      property: 'all',
      duration: 150,
      easing: 'easeOut'
    },

    ...options
  });
}

/**
 * Crea un texto
 */
export function createText(options = {}) {
  return createUIComponent({
    type: UIElementType.TEXT,
    text: options.text || 'Text',
    textColor: options.textColor || '#ffffff',
    textSize: options.textSize || 16,
    textAlign: options.textAlign || 'left',
    fontFamily: options.fontFamily || 'system',
    backgroundColor: 'transparent',
    interactive: false,

    ...options
  });
}

/**
 * Crea una imagen
 */
export function createImage(options = {}) {
  return createUIComponent({
    type: UIElementType.IMAGE,
    image: options.image || null,
    preserveAspect: options.preserveAspect !== false,
    backgroundColor: 'transparent',
    interactive: options.interactive || false,
    ...options
  });
}

/**
 * Crea un modal
 */
export function createModal(options = {}) {
  return createUIComponent({
    type: UIElementType.MODAL,
    isModal: true,
    visible: false,
    enabled: false,
    size: options.size || { width: 400, height: 300 },
    backgroundColor: options.backgroundColor || 'rgba(0, 0, 0, 0.8)',
    zIndex: options.zIndex || 1000,

    // Animaciones
    modalShow: {
      property: 'opacity',
      from: 0,
      to: 1,
      duration: 300,
      easing: 'easeOut'
    },
    modalHide: {
      property: 'opacity',
      from: 1,
      to: 0,
      duration: 300,
      easing: 'easeIn'
    },

    ...options
  });
}

/**
 * Crea un HUD element
 */
export function createHUD(options = {}) {
  return createUIComponent({
    type: UIElementType.HUD,
    screen: 'hud',
    anchor: options.anchor || 'topLeft',
    position: options.position || { x: 20, y: 20 },
    zIndex: options.zIndex || 100,
    interactive: options.interactive || false,
    ...options
  });
}

/**
 * Crea un input field
 */
export function createInputField(options = {}) {
  return createUIComponent({
    type: UIElementType.INPUT,
    interactive: true,
    focusable: true,
    text: options.text || '',
    textSize: options.textSize || 14,
    backgroundColor: options.backgroundColor || '#ffffff',
    textColor: options.textColor || '#000000',
    size: options.size || { width: 200, height: 30 },

    // Estados
    focus: {
      borderColor: options.focusBorderColor || '#007AFF',
      borderWidth: 2
    },

    ...options
  });
}

/**
 * Crea un slider
 */
export function createSlider(options = {}) {
  return createUIComponent({
    type: UIElementType.SLIDER,
    interactive: true,
    focusable: true,
    minValue: options.minValue || 0,
    maxValue: options.maxValue || 100,
    value: options.value || 50,
    size: options.size || { width: 200, height: 20 },

    callbacks: {
      onChange: options.onChange || null,
      ...options.callbacks
    },

    ...options
  });
}

/**
 * Crea una barra de progreso
 */
export function createProgressBar(options = {}) {
  return createUIComponent({
    type: UIElementType.PROGRESS_BAR,
    value: options.value || 0,
    maxValue: options.maxValue || 100,
    size: options.size || { width: 200, height: 20 },
    backgroundColor: options.backgroundColor || '#333333',
    fillColor: options.fillColor || '#007AFF',
    textColor: options.textColor || '#ffffff',
    showText: options.showText !== false,

    ...options
  });
}

/**
 * Helpers para UI
 */
export const UIHelpers = {
  /**
   * Verifica si un elemento está visible
   */
  isVisible(ui) {
    return ui.visible && ui.opacity > 0;
  },

  /**
   * Verifica si un elemento está habilitado
   */
  isEnabled(ui) {
    return ui.enabled;
  },

  /**
   * Verifica si un elemento es interactivo
   */
  isInteractive(ui) {
    return ui.interactive && UIHelpers.isVisible(ui) && UIHelpers.isEnabled(ui);
  },

  /**
   * Obtiene el estado actual del elemento
   */
  getCurrentState(ui, isHovered, isPressed, isDisabled, isFocused) {
    if (isDisabled) return UIState.DISABLED;
    if (isPressed) return UIState.PRESSED;
    if (isHovered) return UIState.HOVER;
    if (isFocused) return UIState.FOCUSED;
    return UIState.NORMAL;
  },

  /**
   * Calcula la posición absoluta de un elemento
   */
  getAbsolutePosition(ui, parentPosition = { x: 0, y: 0 }) {
    return {
      x: parentPosition.x + ui.position.x,
      y: parentPosition.y + ui.position.y
    };
  },

  /**
   * Convierte coordenadas relativas a absolutas
   */
  anchorToPosition(anchor, size, viewportSize) {
    const anchors = {
      topLeft: { x: 0, y: 0 },
      topCenter: { x: viewportSize.width / 2 - size.width / 2, y: 0 },
      topRight: { x: viewportSize.width - size.width, y: 0 },
      center: {
        x: viewportSize.width / 2 - size.width / 2,
        y: viewportSize.height / 2 - size.height / 2
      },
      bottomLeft: { x: 0, y: viewportSize.height - size.height },
      bottomCenter: {
        x: viewportSize.width / 2 - size.width / 2,
        y: viewportSize.height - size.height
      },
      bottomRight: {
        x: viewportSize.width - size.width,
        y: viewportSize.height - size.height
      }
    };

    return anchors[anchor] || anchors.topLeft;
  }
};

/**
 * Genera un ID único para UI
 */
function generateUIId() {
  return 'ui_' + Math.random().toString(36).substr(2, 9);
}

export default {
  createUIComponent,
  createButton,
  createText,
  createImage,
  createModal,
  createHUD,
  createInputField,
  createSlider,
  createProgressBar,
  UIElementType,
  UIState,
  UIHelpers
};
