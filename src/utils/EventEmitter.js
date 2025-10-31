/**
 * EventEmitter
 * Sistema simple de emisión de eventos para comunicación entre sistemas
 */

class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  /**
   * Registra un listener para un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función callback
   * @param {Object} options - Opciones (priority, once)
   */
  on(event, callback, options = {}) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event);
    const listener = {
      callback,
      priority: options.priority || 0,
      once: options.once || false
    };

    // Insertar según prioridad (mayor prioridad primero)
    const index = listeners.findIndex(l => l.priority < listener.priority);
    if (index === -1) {
      listeners.push(listener);
    } else {
      listeners.splice(index, 0, listener);
    }

    return () => this.off(event, callback);
  }

  /**
   * Registra un listener que se ejecuta solo una vez
   */
  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true });
  }

  /**
   * Elimina un listener
   */
  off(event, callback) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event);
    const index = listeners.findIndex(l => l.callback === callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }

    // Limpiar si no hay listeners
    if (listeners.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emite un evento
   */
  emit(event, ...args) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event);
    const toRemove = [];

    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];

      try {
        listener.callback(...args);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }

      if (listener.once) {
        toRemove.push(listener.callback);
      }
    }

    // Remover listeners de "once"
    toRemove.forEach(callback => this.off(event, callback));
  }

  /**
   * Elimina todos los listeners de un evento
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Obtiene el número de listeners para un evento
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }
}

export default EventEmitter;
