/**
 * RigidBody Component
 * Componente para agregar física a una entidad
 */

import { ComponentRegistry } from '../../core/Component.js';

/**
 * Tipos de rigid body
 */
export const RigidBodyType = {
  DYNAMIC: 'dynamic',      // Afectado por fuerzas
  FIXED: 'fixed',          // No se mueve (estático)
  KINEMATIC: 'kinematic',  // Controlado manualmente
  KINEMATIC_VELOCITY: 'kinematicVelocity' // Controlado por velocidad
};

/**
 * Crea un componente RigidBody
 */
export function createRigidBody(options = {}) {
  return ComponentRegistry.create('rigidbody', {
    type: options.type || RigidBodyType.DYNAMIC,
    mass: options.mass || 1,
    friction: options.friction || 0.5,
    restitution: options.restitution || 0.3, // rebote
    linearDamping: options.linearDamping || 0,
    angularDamping: options.angularDamping || 0,
    lockTranslations: options.lockTranslations || false,
    lockRotations: options.lockRotations || false,
    gravity: options.gravity !== undefined ? options.gravity : true,
    ...options
  });
}

/**
 * Crea un rigid body dinámico
 */
export function createDynamicBody(mass = 1, options = {}) {
  return createRigidBody({
    type: RigidBodyType.DYNAMIC,
    mass,
    ...options
  });
}

/**
 * Crea un rigid body estático (no se mueve)
 */
export function createStaticBody(options = {}) {
  return createRigidBody({
    type: RigidBodyType.FIXED,
    mass: 0,
    ...options
  });
}

/**
 * Crea un rigid body cinemático
 */
export function createKinematicBody(options = {}) {
  return createRigidBody({
    type: RigidBodyType.KINEMATIC,
    mass: 0,
    ...options
  });
}

/**
 * Helpers para trabajar con rigid bodies
 */
export const RigidBodyHelpers = {
  /**
   * Verifica si el body es dinámico
   */
  isDynamic(rigidBody) {
    return rigidBody.type === RigidBodyType.DYNAMIC;
  },

  /**
   * Verifica si el body estático
   */
  isStatic(rigidBody) {
    return rigidBody.type === RigidBodyType.FIXED;
  },

  /**
   * Verifica si el body es cinemático
   */
  isKinematic(rigidBody) {
    return rigidBody.type === RigidBodyType.KINEMATIC ||
           rigidBody.type === RigidBodyType.KINEMATIC_VELOCITY;
  },

  /**
   * Verifica si el body tiene masa
   */
  hasMass(rigidBody) {
    return rigidBody.mass > 0;
  }
};

export default {
  createRigidBody,
  createDynamicBody,
  createStaticBody,
  createKinematicBody,
  RigidBodyType,
  RigidBodyHelpers
};
