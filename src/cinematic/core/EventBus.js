/**
 * EVENT BUS - Sistema de eventos pub/sub
 * Permite comunicación desacoplada entre componentes
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   * @param {Object} options - Opciones (once, priority)
   * @returns {Function} Función para desuscribirse
   */
  on(event, callback, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      context: options.context || null
    };

    const listeners = this.listeners.get(event);
    listeners.push(listener);

    // Ordenar por prioridad (mayor primero)
    listeners.sort((a, b) => b.priority - a.priority);

    // Retornar función para desuscribirse
    return () => this.off(event, callback);
  }

  /**
   * Suscribirse a un evento una sola vez
   */
  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true });
  }

  /**
   * Desuscribirse de un evento
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const listeners = this.listeners.get(event);
    const index = listeners.findIndex(l => l.callback === callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }

    // Limpiar si no hay listeners
    if (listeners.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Emitir un evento
   */
  emit(event, data) {
    // Guardar en historial
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now()
    });

    // Limitar tamaño del historial
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    if (!this.listeners.has(event)) return;

    const listeners = [...this.listeners.get(event)];

    listeners.forEach(listener => {
      try {
        if (listener.context) {
          listener.callback.call(listener.context, data);
        } else {
          listener.callback(data);
        }

        // Remover si es once
        if (listener.once) {
          this.off(event, listener.callback);
        }
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
  }

  /**
   * Emitir un evento de forma asíncrona
   */
  async emitAsync(event, data) {
    if (!this.listeners.has(event)) return;

    const listeners = [...this.listeners.get(event)];

    for (const listener of listeners) {
      try {
        if (listener.context) {
          await listener.callback.call(listener.context, data);
        } else {
          await listener.callback(data);
        }

        if (listener.once) {
          this.off(event, listener.callback);
        }
      } catch (error) {
        console.error(`Error in async event listener for "${event}":`, error);
      }
    }
  }

  /**
   * Remover todos los listeners de un evento
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Obtener cantidad de listeners de un evento
   */
  listenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).length : 0;
  }

  /**
   * Obtener historial de eventos
   */
  getEventHistory(eventFilter = null) {
    if (eventFilter) {
      return this.eventHistory.filter(e => e.event === eventFilter);
    }
    return [...this.eventHistory];
  }

  /**
   * Limpiar historial
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Debug: mostrar todos los eventos registrados
   */
  debugListeners() {
    const debug = {};
    this.listeners.forEach((listeners, event) => {
      debug[event] = listeners.length;
    });
    return debug;
  }
}

// Instancia global singleton
let globalEventBus = null;

export function getGlobalEventBus() {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}

export default EventBus;
