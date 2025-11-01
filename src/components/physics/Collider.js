/**
 * Collider Component
 * Componente de colisión para physics
 */

import { ComponentRegistry } from '../../core/Component.js';

/**
 * Tipos de formas de colisión
 */
export const ColliderShape = {
  BOX: 'box',
  SPHERE: 'sphere',
  CYLINDER: 'cylinder',
  CAPSULE: 'capsule',
  CONVEX_HULL: 'convexHull',
  TRI_MESH: 'trimesh'
};

/**
 * Material de colisión
 */
export function createColliderMaterial(options = {}) {
  return {
    friction: options.friction !== undefined ? options.friction : 0.5,
    restitution: options.restitution !== undefined ? options.restitution : 0.3, // rebote
    density: options.density || 1.0,
    ...options
  };
}

/**
 * Crea un componente Collider
 */
export function createCollider(options = {}) {
  const {
    shape = ColliderShape.BOX,
    size = [1, 1, 1],
    radius = 0.5,
    height = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    isTrigger = false,
    material = createColliderMaterial(),
    ...shapeConfig
  } = options;

  return ComponentRegistry.create('collider', {
    shape,
    // Box
    size,
    // Sphere
    radius,
    // Cylinder/Capsule
    height,
    // Posición local relativa al rigid body
    position,
    // Rotación local
    rotation,
    // Escala
    scale,
    // Trigger (no genera respuesta física, solo detección)
    isTrigger,
    // Material
    material,
    // Config extra según shape
    ...shapeConfig
  });
}

/**
 * Crea un collider tipo box
 */
export function createBoxCollider(size = [1, 1, 1], options = {}) {
  return createCollider({
    shape: ColliderShape.BOX,
    size,
    ...options
  });
}

/**
 * Crea un collider tipo sphere
 */
export function createSphereCollider(radius = 0.5, options = {}) {
  return createCollider({
    shape: ColliderShape.SPHERE,
    radius,
    ...options
  });
}

/**
 * Crea un collider tipo cylinder
 */
export function createCylinderCollider(radius = 0.5, height = 1, options = {}) {
  return createCollider({
    shape: ColliderShape.CYLINDER,
    radius,
    height,
    ...options
  });
}

/**
 * Crea un collider tipo capsule
 */
export function createCapsuleCollider(radius = 0.5, height = 1, options = {}) {
  return createCollider({
    shape: ColliderShape.CAPSULE,
    radius,
    height,
    ...options
  });
}

/**
 * Crea un collider desde una mesh (concave)
 */
export function createMeshCollider(vertices, indices, options = {}) {
  return createCollider({
    shape: ColliderShape.TRI_MESH,
    vertices,
    indices,
    ...options
  });
}

/**
 * Crea un convex hull desde puntos
 */
export function createConvexHullCollider(points, options = {}) {
  return createCollider({
    shape: ColliderShape.CONVEX_HULL,
    points,
    ...options
  });
}

/**
 * Helpers para colliders
 */
export const ColliderHelpers = {
  /**
   * Obtiene las dimensiones del collider
   */
  getDimensions(collider) {
    switch (collider.shape) {
      case ColliderShape.BOX:
        return {
          width: collider.size[0],
          height: collider.size[1],
          depth: collider.size[2]
        };
      case ColliderShape.SPHERE:
        return {
          radius: collider.radius,
          diameter: collider.radius * 2
        };
      case ColliderShape.CYLINDER:
      case ColliderShape.CAPSULE:
        return {
          radius: collider.radius,
          height: collider.height,
          diameter: collider.radius * 2
        };
      default:
        return {};
    }
  },

  /**
   * Verifica si es un collider simple (no mesh)
   */
  isSimpleCollider(collider) {
    const simpleShapes = [
      ColliderShape.BOX,
      ColliderShape.SPHERE,
      ColliderShape.CYLINDER,
      ColliderShape.CAPSULE
    ];
    return simpleShapes.includes(collider.shape);
  },

  /**
   * Verifica si es un collider de mesh
   */
  isMeshCollider(collider) {
    return [
      ColliderShape.TRI_MESH,
      ColliderShape.CONVEX_HULL
    ].includes(collider.shape);
  }
};

export default {
  createCollider,
  createBoxCollider,
  createSphereCollider,
  createCylinderCollider,
  createCapsuleCollider,
  createMeshCollider,
  createConvexHullCollider,
  createColliderMaterial,
  ColliderShape,
  ColliderHelpers
};