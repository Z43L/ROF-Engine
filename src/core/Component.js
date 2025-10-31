/**
 * Component
 * Define los tipos de componentes disponibles en el engine
 * Los componentes son solo datos, sin lógica
 */

/**
 * Registro de tipos de componentes
 */
const ComponentRegistry = {
  types: new Map(),

  /**
   * Registra un nuevo tipo de componente
   * @param {string} type - Nombre del tipo
   * @param {Object} schema - Schema de validación (opcional)
   * @param {Function} factory - Función factory (opcional)
   */
  register(type, schema = null, factory = null) {
    if (this.types.has(type)) {
      console.warn(`Component type '${type}' already registered`);
      return;
    }

    this.types.set(type, {
      schema,
      factory: factory || ((data) => data)
    });
  },

  /**
   * Verifica si un tipo está registrado
   */
  has(type) {
    return this.types.has(type);
  },

  /**
   * Crea un componente del tipo especificado
   */
  create(type, data = {}) {
    const componentType = this.types.get(type);

    if (!componentType) {
      console.warn(`Component type '${type}' not registered, creating generic component`);
      return data;
    }

    // Validar con schema si existe
    if (componentType.schema) {
      this.validate(type, data);
    }

    // Usar factory para crear el componente
    return componentType.factory(data);
  },

  /**
   * Valida datos contra el schema
   */
  validate(type, data) {
    const componentType = this.types.get(type);
    if (!componentType || !componentType.schema) return true;

    const schema = componentType.schema;

    for (const [key, validator] of Object.entries(schema)) {
      if (validator.required && !(key in data)) {
        throw new Error(`Component '${type}' missing required field '${key}'`);
      }

      if (key in data && validator.type) {
        const actualType = typeof data[key];
        if (actualType !== validator.type) {
          throw new Error(
            `Component '${type}' field '${key}' expected type '${validator.type}' but got '${actualType}'`
          );
        }
      }

      if (key in data && validator.validate) {
        if (!validator.validate(data[key])) {
          throw new Error(`Component '${type}' field '${key}' failed validation`);
        }
      }
    }

    return true;
  },

  /**
   * Obtiene todos los tipos registrados
   */
  getAllTypes() {
    return Array.from(this.types.keys());
  },

  /**
   * Limpia el registro
   */
  clear() {
    this.types.clear();
  }
};

// Componentes básicos predefinidos

ComponentRegistry.register('transform', {
  x: { type: 'number', required: false },
  y: { type: 'number', required: false },
  z: { type: 'number', required: false },
  rotationX: { type: 'number', required: false },
  rotationY: { type: 'number', required: false },
  rotationZ: { type: 'number', required: false },
  scaleX: { type: 'number', required: false },
  scaleY: { type: 'number', required: false },
  scaleZ: { type: 'number', required: false }
}, (data) => ({
  x: data.x || 0,
  y: data.y || 0,
  z: data.z || 0,
  rotationX: data.rotationX || 0,
  rotationY: data.rotationY || 0,
  rotationZ: data.rotationZ || 0,
  scaleX: data.scaleX !== undefined ? data.scaleX : 1,
  scaleY: data.scaleY !== undefined ? data.scaleY : 1,
  scaleZ: data.scaleZ !== undefined ? data.scaleZ : 1
}));

ComponentRegistry.register('velocity', {
  x: { type: 'number', required: false },
  y: { type: 'number', required: false },
  z: { type: 'number', required: false }
}, (data) => ({
  x: data.x || 0,
  y: data.y || 0,
  z: data.z || 0
}));

ComponentRegistry.register('mesh', {
  geometry: { type: 'string', required: true },
  material: { type: 'string', required: true }
});

ComponentRegistry.register('rigidbody', {
  mass: { type: 'number', required: false },
  friction: { type: 'number', required: false },
  restitution: { type: 'number', required: false },
  type: { type: 'string', required: false } // 'dynamic', 'static', 'kinematic'
}, (data) => ({
  mass: data.mass !== undefined ? data.mass : 1,
  friction: data.friction !== undefined ? data.friction : 0.5,
  restitution: data.restitution !== undefined ? data.restitution : 0.2,
  type: data.type || 'dynamic'
}));

ComponentRegistry.register('camera', {
  fov: { type: 'number', required: false },
  near: { type: 'number', required: false },
  far: { type: 'number', required: false },
  active: { type: 'boolean', required: false }
}, (data) => ({
  fov: data.fov || 75,
  near: data.near || 0.1,
  far: data.far || 1000,
  active: data.active !== undefined ? data.active : true
}));

export { ComponentRegistry };
export default ComponentRegistry;
