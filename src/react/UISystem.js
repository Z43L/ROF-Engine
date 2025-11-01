/**
 * UISystem React Component
 * Integra el UISystem con React
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import UISystem from '../systems/UISystem.js';

/**
 * Contexto para el UISystem
 */
const UISystemContext = createContext(null);

/**
 * Hook para usar el UISystem
 */
export function useUISystem() {
  const context = useContext(UISystemContext);
  if (!context) {
    throw new Error('useUISystem debe usarse dentro de UISystemProvider');
  }
  return context.uiSystem;
}

/**
 * Provider del UISystem
 */
export function UISystemProvider({ children, onScreenChange, onModalChange }) {
  const [uiSystem] = useState(() => new UISystem());
  const [screens, setScreens] = useState([]);
  const [activeScreen, setActiveScreen] = useState(null);
  const [modals, setModals] = useState([]);

  useEffect(() => {
    // Configurar event listeners
    const handleScreenChange = (data) => {
      if (onScreenChange) onScreenChange(data);

      // Actualizar estado React
      setScreens(Array.from(uiSystem.screens.values()));
      setActiveScreen(uiSystem.activeScreen);
    };

    const handleModalChange = (data) => {
      if (onModalChange) onModalChange(data);

      // Actualizar estado React
      setModals(uiSystem.modalStack);
    };

    uiSystem.on('screenChanged', handleScreenChange);
    uiSystem.on('modalChanged', handleModalChange);

    return () => {
      uiSystem.off('screenChanged', handleScreenChange);
      uiSystem.off('modalChanged', handleModalChange);
      uiSystem.destroy();
    };
  }, [uiSystem, onScreenChange, onModalChange]);

  const value = {
    uiSystem,
    screens,
    activeScreen,
    modals
  };

  return (
    <UISystemContext.Provider value={value}>
      {children}
    </UISystemContext.Provider>
  );
}

/**
 * Componente para gestionar una pantalla UI
 */
export function UIScreen({
  id,
  type = 'overlay', // overlay, fullscreen, modal
  visible = true,
  enabled = true,
  interactive = true,
  data = {},
  children,
  onShow,
  onHide,
  onUpdate
}) {
  const uiSystem = useUISystem();
  const entityRef = useRef(null);

  useEffect(() => {
    // Crear entidad UI
    const entity = uiSystem.world.createEntity();
    entity.addComponent('ui', {
      id,
      type: 'screen',
      screen: id,
      visible,
      enabled,
      interactive,
      data,
      isModal: type === 'modal'
    });

    entityRef.current = entity;

    return () => {
      if (entityRef.current) {
        uiSystem.world.removeEntity(entityRef.current);
      }
    };
  }, [id, uiSystem]);

  useEffect(() => {
    if (onShow && visible) {
      onShow();
    }
    if (onHide && !visible) {
      onHide();
    }
  }, [visible, onShow, onHide]);

  useEffect(() => {
    if (onUpdate) {
      onUpdate(data);
    }
  }, [data, onUpdate]);

  if (type === 'modal' && !uiSystem.modalStack.includes(id)) {
    return null;
  }

  if (!visible) {
    return null;
  }

  return (
    <div className={`ui-screen ui-screen--${type}`}>
      {children}
    </div>
  );
}

/**
 * Componente para un botón UI
 */
export function UIButton({
  id,
  text = 'Button',
  position = { x: 0, y: 0 },
  size = { width: 100, height: 40 },
  visible = true,
  enabled = true,
  onClick,
  onHover,
  onFocus,
  className = '',
  style = {},
  children
}) {
  const uiSystem = useUISystem();
  const entityRef = useRef(null);

  useEffect(() => {
    // Crear entidad UI
    const entity = uiSystem.world.createEntity();
    entity.addComponent('ui', {
      id,
      type: 'button',
      visible,
      enabled,
      focusable: true,
      data: {
        text,
        position,
        size
      },
      callbacks: {
        onClick,
        onHover,
        onFocus
      }
    });

    entityRef.current = entity;

    return () => {
      if (entityRef.current) {
        uiSystem.world.removeEntity(entityRef.current);
      }
    };
  }, [id, text, position, size, visible, enabled, onClick, onHover, onFocus, uiSystem]);

  return (
    <button
      id={id}
      className={`ui-button ${className}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        ...style
      }}
      onClick={onClick}
      onMouseEnter={onHover}
      onFocus={onFocus}
    >
      {children || text}
    </button>
  );
}

/**
 * Componente para texto UI
 */
export function UIText({
  id,
  text = '',
  position = { x: 0, y: 0 },
  fontSize = 16,
  color = '#ffffff',
  visible = true,
  align = 'left',
  className = '',
  style = {},
  children
}) {
  const uiSystem = useUISystem();
  const entityRef = useRef(null);

  useEffect(() => {
    const entity = uiSystem.world.createEntity();
    entity.addComponent('ui', {
      id,
      type: 'text',
      visible,
      data: {
        text,
        position,
        fontSize,
        color,
        align
      }
    });

    entityRef.current = entity;

    return () => {
      if (entityRef.current) {
        uiSystem.world.removeEntity(entityRef.current);
      }
    };
  }, [id, text, position, fontSize, color, visible, align, uiSystem]);

  return (
    <div
      id={id}
      className={`ui-text ui-text--${align} ${className}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        fontSize: `${fontSize}px`,
        color,
        textAlign: align,
        ...style
      }}
    >
      {children || text}
    </div>
  );
}

/**
 * Componente para una imagen UI
 */
export function UIImage({
  id,
  src = '',
  position = { x: 0, y: 0 },
  size = { width: 100, height: 100 },
  visible = true,
  opacity = 1,
  className = '',
  style = {},
  onLoad,
  onError
}) {
  const uiSystem = useUISystem();
  const entityRef = useRef(null);

  useEffect(() => {
    const entity = uiSystem.world.createEntity();
    entity.addComponent('ui', {
      id,
      type: 'image',
      visible,
      data: {
        src,
        position,
        size,
        opacity
      },
      callbacks: {
        onLoad,
        onError
      }
    });

    entityRef.current = entity;

    return () => {
      if (entityRef.current) {
        uiSystem.world.removeEntity(entityRef.current);
      }
    };
  }, [id, src, position, size, visible, opacity, onLoad, onError, uiSystem]);

  return (
    <img
      id={id}
      src={src}
      className={`ui-image ${className}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        opacity,
        ...style
      }}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

/**
 * Componente para un panel UI
 */
export function UIPanel({
  id,
  position = { x: 0, y: 0 },
  size = { width: 200, height: 200 },
  visible = true,
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  border = '1px solid #ffffff',
  borderRadius = 4,
  padding = 16,
  className = '',
  style = {},
  children
}) {
  const uiSystem = useUISystem();
  const entityRef = useRef(null);

  useEffect(() => {
    const entity = uiSystem.world.createEntity();
    entity.addComponent('ui', {
      id,
      type: 'panel',
      visible,
      data: {
        position,
        size,
        backgroundColor,
        border,
        borderRadius,
        padding
      }
    });

    entityRef.current = entity;

    return () => {
      if (entityRef.current) {
        uiSystem.world.removeEntity(entityRef.current);
      }
    };
  }, [id, position, size, visible, backgroundColor, border, borderRadius, padding, uiSystem]);

  return (
    <div
      id={id}
      className={`ui-panel ${className}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundColor,
        border,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        ...style
      }}
    >
      {children}
    </div>
  );
}

/**
 * Componente para una barra de progreso
 */
export function UIProgressBar({
  id,
  position = { x: 0, y: 0 },
  size = { width: 200, height: 20 },
  value = 0, // 0-100
  visible = true,
  backgroundColor = '#333333',
  foregroundColor = '#00ff00',
  className = '',
  style = {}
}) {
  const uiSystem = useUISystem();
  const entityRef = useRef(null);

  useEffect(() => {
    const entity = uiSystem.world.createEntity();
    entity.addComponent('ui', {
      id,
      type: 'progressbar',
      visible,
      data: {
        position,
        size,
        value,
        backgroundColor,
        foregroundColor
      }
    });

    entityRef.current = entity;

    return () => {
      if (entityRef.current) {
        uiSystem.world.removeEntity(entityRef.current);
      }
    };
  }, [id, position, size, value, visible, backgroundColor, foregroundColor, uiSystem]);

  const percentage = Math.max(0, Math.min(100, value));

  return (
    <div
      id={id}
      className={`ui-progressbar ${className}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundColor,
        borderRadius: '10px',
        overflow: 'hidden',
        ...style
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: foregroundColor,
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  );
}