/**
 * Transform Component
 * Componente de transformación 3D (posición, rotación, escala)
 */

import { ComponentRegistry } from '../../core/Component.js';

// Ya está registrado en Component.js, aquí proporcionamos helpers

/**
 * Crea un componente Transform con valores por defecto
 */
export function createTransform(options = {}) {
  return ComponentRegistry.create('transform', options);
}

/**
 * Helpers para manipular transforms
 */
export const TransformHelpers = {
  /**
   * Establece la posición
   */
  setPosition(transform, x, y, z) {
    transform.x = x;
    transform.y = y;
    transform.z = z;
    return transform;
  },

  /**
   * Mueve el transform por un delta
   */
  translate(transform, dx, dy, dz) {
    transform.x += dx;
    transform.y += dy;
    transform.z += dz;
    return transform;
  },

  /**
   * Establece la rotación (en radianes)
   */
  setRotation(transform, x, y, z) {
    transform.rotationX = x;
    transform.rotationY = y;
    transform.rotationZ = z;
    return transform;
  },

  /**
   * Rota el transform
   */
  rotate(transform, dx, dy, dz) {
    transform.rotationX += dx;
    transform.rotationY += dy;
    transform.rotationZ += dz;
    return transform;
  },

  /**
   * Establece la escala
   */
  setScale(transform, x, y, z) {
    transform.scaleX = x;
    transform.scaleY = y !== undefined ? y : x;
    transform.scaleZ = z !== undefined ? z : x;
    return transform;
  },

  /**
   * Obtiene la distancia a otro transform
   */
  distanceTo(transform1, transform2) {
    const dx = transform2.x - transform1.x;
    const dy = transform2.y - transform1.y;
    const dz = transform2.z - transform1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
};

export default {
  createTransform,
  ...TransformHelpers
};
