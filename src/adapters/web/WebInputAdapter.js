/**
 * WebInputAdapter
 * Adaptador de input para navegadores web
 * Maneja mouse, teclado y touch
 */

class WebInputAdapter {
  constructor(config = {}) {
    this.config = {
      element: config.element || window,
      preventDefaults: config.preventDefaults !== false,
      capturePointer: config.capturePointer !== false,
      ...config
    };

    this.state = null;
    this.emitter = null;
    this.element = null;
    this.listeners = [];
  }

  init(state, emitter) {
    this.state = state;
    this.emitter = emitter;
    this.element = this.config.element;

    this._setupMouseListeners();
    this._setupKeyboardListeners();
    this._setupTouchListeners();
  }

  _setupMouseListeners() {
    const onMouseDown = (e) => {
      if (this.config.preventDefaults) e.preventDefault();

      this.state.pointer.isDown = true;
      this.state.pointer.justPressed = true;
      this._updatePointerPosition(e.clientX, e.clientY);

      this.emitter.emit('pointerDown', {
        x: e.clientX,
        y: e.clientY,
        button: e.button
      });
    };

    const onMouseUp = (e) => {
      if (this.config.preventDefaults) e.preventDefault();

      this.state.pointer.isDown = false;
      this.state.pointer.justReleased = true;

      this.emitter.emit('pointerUp', {
        x: e.clientX,
        y: e.clientY,
        button: e.button
      });
    };

    const onMouseMove = (e) => {
      this._updatePointerPosition(e.clientX, e.clientY);

      this.emitter.emit('pointerMove', {
        x: e.clientX,
        y: e.clientY,
        deltaX: this.state.pointer.deltaX,
        deltaY: this.state.pointer.deltaY
      });
    };

    const onContextMenu = (e) => {
      if (this.config.preventDefaults) e.preventDefault();
    };

    this.element.addEventListener('mousedown', onMouseDown);
    this.element.addEventListener('mouseup', onMouseUp);
    this.element.addEventListener('mousemove', onMouseMove);
    this.element.addEventListener('contextmenu', onContextMenu);

    this.listeners.push(
      { event: 'mousedown', handler: onMouseDown },
      { event: 'mouseup', handler: onMouseUp },
      { event: 'mousemove', handler: onMouseMove },
      { event: 'contextmenu', handler: onContextMenu }
    );

    // Pointer lock (opcional para juegos FPS)
    if (this.config.capturePointer) {
      this.element.addEventListener('click', () => {
        if (this.element.requestPointerLock) {
          this.element.requestPointerLock();
        }
      });
    }
  }

  _setupKeyboardListeners() {
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();

      if (!this.state.keys.get(key)) {
        this.state.keys.set(key, true);
        this.state.keysJustPressed.add(key);

        this.emitter.emit('keyDown', {
          key,
          code: e.code,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey
        });
      }

      // Prevenir comportamientos por defecto (flechas, espacio, etc.)
      if (this.config.preventDefaults) {
        const preventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
        if (preventKeys.includes(e.key)) {
          e.preventDefault();
        }
      }
    };

    const onKeyUp = (e) => {
      const key = e.key.toLowerCase();

      this.state.keys.set(key, false);
      this.state.keysJustReleased.add(key);

      this.emitter.emit('keyUp', {
        key,
        code: e.code
      });
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    this.listeners.push(
      { event: 'keydown', handler: onKeyDown, target: window },
      { event: 'keyup', handler: onKeyUp, target: window }
    );
  }

  _setupTouchListeners() {
    const onTouchStart = (e) => {
      if (this.config.preventDefaults) e.preventDefault();

      this.state.touches = Array.from(e.touches).map(touch => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY
      }));

      // Actualizar pointer con el primer touch
      if (e.touches.length > 0) {
        this.state.pointer.isDown = true;
        this.state.pointer.justPressed = true;
        this._updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
      }

      this.emitter.emit('touchStart', { touches: this.state.touches });
    };

    const onTouchMove = (e) => {
      if (this.config.preventDefaults) e.preventDefault();

      this.state.touches = Array.from(e.touches).map(touch => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY
      }));

      if (e.touches.length > 0) {
        this._updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
      }

      this.emitter.emit('touchMove', { touches: this.state.touches });

      // Detectar gestos de pinch
      if (e.touches.length === 2) {
        this._detectPinchGesture(e.touches);
      }
    };

    const onTouchEnd = (e) => {
      if (this.config.preventDefaults) e.preventDefault();

      this.state.touches = Array.from(e.touches).map(touch => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY
      }));

      if (e.touches.length === 0) {
        this.state.pointer.isDown = false;
        this.state.pointer.justReleased = true;
      }

      this.emitter.emit('touchEnd', { touches: this.state.touches });
    };

    this.element.addEventListener('touchstart', onTouchStart);
    this.element.addEventListener('touchmove', onTouchMove);
    this.element.addEventListener('touchend', onTouchEnd);

    this.listeners.push(
      { event: 'touchstart', handler: onTouchStart },
      { event: 'touchmove', handler: onTouchMove },
      { event: 'touchend', handler: onTouchEnd }
    );
  }

  _updatePointerPosition(x, y) {
    this.state.pointer.prevX = this.state.pointer.x;
    this.state.pointer.prevY = this.state.pointer.y;
    this.state.pointer.x = x;
    this.state.pointer.y = y;
    this.state.pointer.deltaX = x - this.state.pointer.prevX;
    this.state.pointer.deltaY = y - this.state.pointer.prevY;
  }

  _detectPinchGesture(touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];

    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Implementar lógica de pinch
    // (necesitaría guardar el distance anterior)
  }

  update(deltaTime) {
    // No necesita actualización continua en web
  }

  destroy() {
    // Remover todos los event listeners
    this.listeners.forEach(({ event, handler, target }) => {
      (target || this.element).removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

export default WebInputAdapter;
