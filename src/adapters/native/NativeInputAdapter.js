/**
 * NativeInputAdapter
 * Adaptador de input para React Native
 * Usa PanResponder y Gesture Handler
 */

import { PanResponder } from 'react-native';

class NativeInputAdapter {
  constructor(config = {}) {
    this.config = config;
    this.state = null;
    this.emitter = null;
    this.panResponder = null;
    this.gestureHandlers = new Map();
  }

  init(state, emitter) {
    this.state = state;
    this.emitter = emitter;
    this._setupPanResponder();
  }

  _setupPanResponder() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;

        this.state.pointer.isDown = true;
        this.state.pointer.justPressed = true;
        this._updatePointerPosition(locationX, locationY);

        this.emitter.emit('pointerDown', {
          x: locationX,
          y: locationY
        });
      },

      onPanResponderMove: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        this._updatePointerPosition(locationX, locationY);

        this.emitter.emit('pointerMove', {
          x: locationX,
          y: locationY,
          deltaX: gestureState.dx,
          deltaY: gestureState.dy
        });
      },

      onPanResponderRelease: (evt, gestureState) => {
        this.state.pointer.isDown = false;
        this.state.pointer.justReleased = true;

        const { locationX, locationY } = evt.nativeEvent;

        this.emitter.emit('pointerUp', {
          x: locationX,
          y: locationY
        });

        // Detectar swipe
        this._detectSwipe(gestureState);
      }
    });
  }

  _updatePointerPosition(x, y) {
    this.state.pointer.prevX = this.state.pointer.x;
    this.state.pointer.prevY = this.state.pointer.y;
    this.state.pointer.x = x;
    this.state.pointer.y = y;
    this.state.pointer.deltaX = x - this.state.pointer.prevX;
    this.state.pointer.deltaY = y - this.state.pointer.prevY;
  }

  _detectSwipe(gestureState) {
    const { dx, dy, vx, vy } = gestureState;
    const minSwipeDistance = 50;
    const minSwipeVelocity = 0.3;

    if (Math.abs(vx) > minSwipeVelocity || Math.abs(vy) > minSwipeVelocity) {
      let direction = null;

      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > minSwipeDistance ? 'right' : dx < -minSwipeDistance ? 'left' : null;
      } else {
        direction = dy > minSwipeDistance ? 'down' : dy < -minSwipeDistance ? 'up' : null;
      }

      if (direction) {
        this.emitter.emit('swipe', {
          direction,
          distance: Math.sqrt(dx * dx + dy * dy),
          velocity: Math.sqrt(vx * vx + vy * vy)
        });
      }
    }
  }

  /**
   * Obtiene los handlers para usar en componentes React Native
   */
  getPanHandlers() {
    return this.panResponder ? this.panResponder.panHandlers : {};
  }

  update(deltaTime) {
    // No necesita actualización continua
  }

  destroy() {
    this.panResponder = null;
    this.gestureHandlers.clear();
  }
}

export default NativeInputAdapter;
