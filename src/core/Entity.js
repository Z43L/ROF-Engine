/**
 * Entity
 * Representa una entidad en el juego (solo un ID con componentes)
 * Siguiendo el patrón Entity-Component-System puro
 */

let nextEntityId = 1;

class Entity {
  constructor(world) {
    this.id = nextEntityId++;
    this.world = world;
    this.components = new Map();
    this.active = true;
    this.tags = new Set();
  }

  /**
   * Agrega un componente a la entidad
   * @param {string} type - Tipo del componente
   * @param {*} data - Datos del componente
   */
  addComponent(type, data = {}) {
    if (this.components.has(type)) {
      console.warn(`Entity ${this.id} already has component '${type}'`);
      return this;
    }

    this.components.set(type, data);

    // Notificar al world que se agregó un componente
    if (this.world) {
      this.world.onComponentAdded(this, type);
    }

    return this;
  }

  /**
   * Obtiene un componente
   */
  getComponent(type) {
    return this.components.get(type);
  }

  /**
   * Verifica si tiene un componente
   */
  hasComponent(type) {
    return this.components.has(type);
  }

  /**
   * Verifica si tiene todos los componentes especificados
   */
  hasComponents(...types) {
    return types.every(type => this.components.has(type));
  }

  /**
   * Elimina un componente
   */
  removeComponent(type) {
    if (!this.components.has(type)) {
      return this;
    }

    this.components.delete(type);

    // Notificar al world
    if (this.world) {
      this.world.onComponentRemoved(this, type);
    }

    return this;
  }

  /**
   * Actualiza los datos de un componente
   */
  updateComponent(type, data) {
    if (!this.components.has(type)) {
      console.warn(`Entity ${this.id} does not have component '${type}'`);
      return this;
    }

    const current = this.components.get(type);
    this.components.set(type, { ...current, ...data });

    return this;
  }

  /**
   * Agrega un tag a la entidad
   */
  addTag(tag) {
    this.tags.add(tag);
    if (this.world) {
      this.world.onTagAdded(this, tag);
    }
    return this;
  }

  /**
   * Elimina un tag
   */
  removeTag(tag) {
    this.tags.delete(tag);
    if (this.world) {
      this.world.onTagRemoved(this, tag);
    }
    return this;
  }

  /**
   * Verifica si tiene un tag
   */
  hasTag(tag) {
    return this.tags.has(tag);
  }

  /**
   * Destruye la entidad
   */
  destroy() {
    if (this.world) {
      this.world.removeEntity(this);
    }
    this.components.clear();
    this.tags.clear();
    this.active = false;
  }

  /**
   * Clona la entidad
   */
  clone() {
    const clone = new Entity(this.world);

    // Copiar componentes
    this.components.forEach((data, type) => {
      clone.addComponent(type, { ...data });
    });

    // Copiar tags
    this.tags.forEach(tag => clone.addTag(tag));

    return clone;
  }

  /**
   * Serializa la entidad a JSON
   */
  toJSON() {
    return {
      id: this.id,
      active: this.active,
      tags: Array.from(this.tags),
      components: Array.from(this.components.entries()).map(([type, data]) => ({
        type,
        data
      }))
    };
  }

  /**
   * Deserializa desde JSON
   */
  static fromJSON(world, json) {
    const entity = new Entity(world);
    entity.active = json.active;

    // Restaurar tags
    json.tags.forEach(tag => entity.addTag(tag));

    // Restaurar componentes
    json.components.forEach(({ type, data }) => {
      entity.addComponent(type, data);
    });

    return entity;
  }
}

export default Entity;
