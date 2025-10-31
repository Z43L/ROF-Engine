/**
 * World
 * Contenedor de todas las entidades y sistemas
 * Gestiona el ciclo de vida de las entidades
 */

import Entity from './Entity.js';
import EventEmitter from '../utils/EventEmitter.js';

class World extends EventEmitter {
  constructor() {
    super();
    this.entities = new Map();
    this.systems = [];
    this.entityIndex = new Map(); // Índice por componentes para búsqueda rápida
    this.tagIndex = new Map(); // Índice por tags
    this.entitiesToAdd = [];
    this.entitiesToRemove = [];
  }

  /**
   * Crea una nueva entidad
   */
  createEntity() {
    const entity = new Entity(this);
    this.entitiesToAdd.push(entity);
    return entity;
  }

  /**
   * Agrega una entidad existente al world
   */
  addEntity(entity) {
    if (this.entities.has(entity.id)) {
      console.warn(`Entity ${entity.id} already exists in world`);
      return;
    }

    this.entitiesToAdd.push(entity);
  }

  /**
   * Elimina una entidad del world
   */
  removeEntity(entity) {
    if (typeof entity === 'number') {
      entity = this.entities.get(entity);
    }

    if (!entity) return;

    if (!this.entitiesToRemove.includes(entity)) {
      this.entitiesToRemove.push(entity);
    }
  }

  /**
   * Procesa las entidades pendientes
   * Se llama al final de cada frame
   */
  processEntityQueue() {
    // Agregar entidades nuevas
    this.entitiesToAdd.forEach(entity => {
      this.entities.set(entity.id, entity);
      this._indexEntity(entity);
      this.emit('entityAdded', entity);
      this._notifySystemsEntityAdded(entity);
    });
    this.entitiesToAdd = [];

    // Eliminar entidades
    this.entitiesToRemove.forEach(entity => {
      this._unindexEntity(entity);
      this.entities.delete(entity.id);
      this.emit('entityRemoved', entity);
      this._notifySystemsEntityRemoved(entity);
    });
    this.entitiesToRemove = [];
  }

  /**
   * Obtiene una entidad por ID
   */
  getEntity(id) {
    return this.entities.get(id);
  }

  /**
   * Obtiene todas las entidades
   */
  getAllEntities() {
    return Array.from(this.entities.values()).filter(e => e.active);
  }

  /**
   * Obtiene entidades con componentes específicos
   */
  getEntitiesWithComponents(...componentTypes) {
    if (componentTypes.length === 0) {
      return this.getAllEntities();
    }

    // Usar índice para búsqueda más eficiente
    const firstType = componentTypes[0];
    const candidates = this.entityIndex.get(firstType) || new Set();

    const result = [];
    for (const entity of candidates) {
      if (entity.active && entity.hasComponents(...componentTypes)) {
        result.push(entity);
      }
    }

    return result;
  }

  /**
   * Obtiene entidades con un tag específico
   */
  getEntitiesWithTag(tag) {
    return Array.from(this.tagIndex.get(tag) || []);
  }

  /**
   * Indexa una entidad por sus componentes
   */
  _indexEntity(entity) {
    entity.components.forEach((data, type) => {
      if (!this.entityIndex.has(type)) {
        this.entityIndex.set(type, new Set());
      }
      this.entityIndex.get(type).add(entity);
    });

    entity.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag).add(entity);
    });
  }

  /**
   * Desindexar una entidad
   */
  _unindexEntity(entity) {
    entity.components.forEach((data, type) => {
      const index = this.entityIndex.get(type);
      if (index) {
        index.delete(entity);
      }
    });

    entity.tags.forEach(tag => {
      const index = this.tagIndex.get(tag);
      if (index) {
        index.delete(entity);
      }
    });
  }

  /**
   * Callback cuando se agrega un componente a una entidad
   */
  onComponentAdded(entity, type) {
    if (!this.entityIndex.has(type)) {
      this.entityIndex.set(type, new Set());
    }
    this.entityIndex.get(type).add(entity);
    this.emit('componentAdded', entity, type);
  }

  /**
   * Callback cuando se elimina un componente
   */
  onComponentRemoved(entity, type) {
    const index = this.entityIndex.get(type);
    if (index) {
      index.delete(entity);
    }
    this.emit('componentRemoved', entity, type);
  }

  /**
   * Callback cuando se agrega un tag
   */
  onTagAdded(entity, tag) {
    if (!this.tagIndex.has(tag)) {
      this.tagIndex.set(tag, new Set());
    }
    this.tagIndex.get(tag).add(entity);
  }

  /**
   * Callback cuando se elimina un tag
   */
  onTagRemoved(entity, tag) {
    const index = this.tagIndex.get(tag);
    if (index) {
      index.delete(entity);
    }
  }

  /**
   * Registra un sistema
   */
  registerSystem(system) {
    if (this.systems.includes(system)) {
      console.warn(`System '${system.name}' already registered`);
      return;
    }

    system.init(this);
    this.systems.push(system);

    // Ordenar por prioridad (mayor prioridad primero)
    this.systems.sort((a, b) => b.priority - a.priority);

    this.emit('systemRegistered', system);
  }

  /**
   * Elimina un sistema
   */
  unregisterSystem(system) {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      system.destroy();
      this.systems.splice(index, 1);
      this.emit('systemUnregistered', system);
    }
  }

  /**
   * Obtiene un sistema por nombre
   */
  getSystem(name) {
    return this.systems.find(s => s.name === name);
  }

  /**
   * Actualiza todos los sistemas
   */
  update(deltaTime) {
    // Actualizar sistemas
    this.systems.forEach(system => {
      if (system.enabled) {
        system.update(deltaTime);
      }
    });

    // Procesar cola de entidades
    this.processEntityQueue();
  }

  /**
   * Notifica a los sistemas que se agregó una entidad
   */
  _notifySystemsEntityAdded(entity) {
    this.systems.forEach(system => {
      if (system.componentTypes.length === 0 ||
          entity.hasComponents(...system.componentTypes)) {
        system.onEntityAdded(entity);
      }
    });
  }

  /**
   * Notifica a los sistemas que se eliminó una entidad
   */
  _notifySystemsEntityRemoved(entity) {
    this.systems.forEach(system => {
      system.onEntityRemoved(entity);
    });
  }

  /**
   * Limpia el world
   */
  clear() {
    this.getAllEntities().forEach(entity => entity.destroy());
    this.processEntityQueue();
    this.entities.clear();
    this.entityIndex.clear();
    this.tagIndex.clear();
  }

  /**
   * Destruye el world
   */
  destroy() {
    this.clear();
    this.systems.forEach(system => system.destroy());
    this.systems = [];
    this.removeAllListeners();
  }

  /**
   * Obtiene estadísticas del world
   */
  get stats() {
    return {
      entities: this.entities.size,
      systems: this.systems.length,
      pendingAdd: this.entitiesToAdd.length,
      pendingRemove: this.entitiesToRemove.length
    };
  }
}

export default World;
