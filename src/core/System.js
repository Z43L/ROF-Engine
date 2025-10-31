/**
 * System
 * Clase base para todos los sistemas del engine
 * Los sistemas contienen toda la lógica y operan sobre entidades con componentes específicos
 */

class System {
  constructor(name, componentTypes = [], priority = 0) {
    this.name = name;
    this.componentTypes = Array.isArray(componentTypes) ? componentTypes : [componentTypes];
    this.priority = priority;
    this.enabled = true;
    this.world = null;
  }

  /**
   * Inicialización del sistema
   * Se llama una vez cuando el sistema se registra en el world
   */
  init(world) {
    this.world = world;
  }

  /**
   * Actualización del sistema
   * Se llama cada frame
   * @param {number} deltaTime - Tiempo transcurrido desde el último frame (en segundos)
   */
  update(deltaTime) {
    if (!this.enabled) return;

    const entities = this.getEntities();
    this.process(entities, deltaTime);
  }

  /**
   * Procesa las entidades relevantes
   * Este método debe ser implementado por las clases hijas
   */
  process(entities, deltaTime) {
    // Implementar en clases hijas
  }

  /**
   * Obtiene las entidades que tienen los componentes requeridos
   */
  getEntities() {
    if (!this.world) return [];

    if (this.componentTypes.length === 0) {
      return this.world.getAllEntities();
    }

    return this.world.getEntitiesWithComponents(...this.componentTypes);
  }

  /**
   * Ejecuta una acción para cada entidad relevante
   */
  forEach(callback) {
    const entities = this.getEntities();
    entities.forEach(entity => callback(entity));
  }

  /**
   * Habilita el sistema
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Deshabilita el sistema
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Limpieza del sistema
   * Se llama cuando el sistema se elimina del world
   */
  destroy() {
    this.world = null;
  }

  /**
   * Callback cuando se agrega una entidad relevante
   */
  onEntityAdded(entity) {
    // Opcional: implementar en clases hijas
  }

  /**
   * Callback cuando se elimina una entidad relevante
   */
  onEntityRemoved(entity) {
    // Opcional: implementar en clases hijas
  }
}

export default System;
