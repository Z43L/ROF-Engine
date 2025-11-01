/**
 * PhysicsSystem
 * Sistema de física usando Rapier.js
 * Maneja rigid bodies, colliders, joints y simulaciones físicas
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';

/**
 * PhysicsSystem - Sistema de física 3D
 */
class PhysicsSystem extends System {
  constructor(worldConfig = {}) {
    super('PhysicsSystem', ['transform', 'rigidbody'], 30); // Prioridad media-alta

    this.worldConfig = {
      gravity: { x: 0, y: -9.81, z: 0 },
      timestep: '1/60',
      enableSleeping: true,
      ...worldConfig
    };

    this.emitter = new EventEmitter();
    this.physicsWorld = null;
    this.rigidBodies = new Map(); // entity -> rigidbody
    this.colliders = new Map(); // entity -> colliders
    this.joints = new Map(); // joint id -> joint

    this._initialized = false;
  }

  async init(world) {
    super.init(world);

    try {
      // Importar Rapier de forma lazy
      const RAPIER = await import('@dimforge/rapier3d-compat');

      // Inicializar Rapier
      await RAPIER.init();

      // Crear mundo físico
      this.physicsWorld = new RAPIER.World(this.worldConfig.gravity);

      // Configurar mundo
      this.physicsWorld.timestep = this.worldConfig.timestep;
      this.physicsWorld.enableSleeping = this.worldConfig.enableSleeping;

      this._initialized = true;
      this.emitter.emit('physicsInitialized', { rapier: RAPIER });

      console.log('✅ PhysicsSystem initialized with Rapier');
    } catch (error) {
      console.error('❌ Failed to initialize PhysicsSystem:', error);
      throw error;
    }
  }

  /**
   * Registra una entidad con componentes físicos
   */
  onEntityAdded(entity) {
    const rigidbody = entity.getComponent('rigidbody');
    const collider = entity.getComponent('collider');
    const transform = entity.getComponent('transform');

    if (rigidbody && transform) {
      this._createRigidBody(entity, rigidbody, transform);
    }

    if (collider && transform) {
      this._createCollider(entity, collider, transform);
    }
  }

  /**
   * Elimina una entidad del sistema físico
   */
  onEntityRemoved(entity) {
    this._removeRigidBody(entity);
    this._removeCollider(entity);
  }

  /**
   * Crea un rigid body
   */
  _createRigidBody(entity, rigidbodyConfig, transform) {
    if (!this._initialized) return;

    const bodyDesc = this._getBodyDescription(rigidbodyConfig);
    const body = this.physicsWorld.createRigidBody(bodyDesc);

    // Configurar posición inicial
    body.setTranslation(
      transform.x,
      transform.y,
      transform.z,
      true
    );

    // Configurar rotación inicial
    body.setRotation(
      {
        x: transform.rotationX || 0,
        y: transform.rotationY || 0,
        z: transform.rotationZ || 0,
        w: 1
      },
      true
    );

    this.rigidBodies.set(entity, {
      body,
      config: rigidbodyConfig,
      mass: rigidbodyConfig.mass || 1,
      type: rigidbodyConfig.type || 'dynamic',
      lockTranslations: rigidbodyConfig.lockTranslations || false,
      lockRotations: rigidbodyConfig.lockRotations || false
    });
  }

  /**
   * Crea un collider
   */
  _createCollider(entity, colliderConfig, transform) {
    if (!this._initialized) return;

    const bodyData = this.rigidBodies.get(entity);
    if (!bodyData) return;

    const colliderDesc = this._getColliderDescription(colliderConfig);
    const collider = this.physicsWorld.createCollider(
      colliderDesc,
      bodyData.body
    );

    if (!this.colliders.has(entity)) {
      this.colliders.set(entity, []);
    }
    this.colliders.get(entity).push({
      collider,
      config: colliderConfig,
      type: colliderConfig.shape || 'box'
    });
  }

  /**
   * Obtiene descripción del rigid body
   */
  _getBodyDescription(config) {
    const RAPIER = window.RAPIER;

    const bodyType = {
      'dynamic': RAPIER.RigidBodyType.Dynamic,
      'fixed': RAPIER.RigidBodyType.Fixed,
      'kinematic': RAPIER.RigidBodyType.KinematicPositionBased,
      'kinematicVelocity': RAPIER.RigidBodyType.KinematicVelocityBased
    }[config.type] || RAPIER.RigidBodyType.Dynamic;

    const desc = RAPIER.RigidBodyDesc.new(bodyType);

    // Configurar masa
    if (config.mass) {
      desc.setMass(config.mass);
    }

    // Configurar damping
    if (config.linearDamping !== undefined) {
      desc.setLinearDamping(config.linearDamping);
    }
    if (config.angularDamping !== undefined) {
      desc.setAngularDamping(config.angularDamping);
    }

    // Configurar bloqueos
    if (config.lockTranslations) {
      desc.lockTranslations();
    }
    if (config.lockRotations) {
      desc.lockRotations();
    }

    return desc;
  }

  /**
   * Obtiene descripción del collider
   */
  _getColliderDescription(config) {
    const RAPIER = window.RAPIER;
    const { shape, ...shapeConfig } = config;

    switch (shape) {
      case 'box':
        const size = shapeConfig.size || [1, 1, 1];
        return RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2);

      case 'sphere':
        const radius = shapeConfig.radius || 0.5;
        return RAPIER.ColliderDesc.ball(radius);

      case 'cylinder':
        const cylRadius = shapeConfig.radius || 0.5;
        const cylHeight = shapeConfig.height || 1;
        return RAPIER.ColliderDesc.cylinder(cylHeight / 2, cylRadius);

      case 'capsule':
        const capRadius = shapeConfig.radius || 0.5;
        const capHeight = shapeConfig.height || 1;
        return RAPIER.ColliderDesc.capsule(capHeight / 2, capRadius);

      case 'trimesh':
        if (shapeConfig.vertices && shapeConfig.indices) {
          return RAPIER.ColliderDesc.trimesh(
            shapeConfig.vertices,
            shapeConfig.indices
          );
        }
        break;

      case 'convexHull':
        if (shapeConfig.points) {
          return RAPIER.ColliderDesc.convexHull(shapeConfig.points);
        }
        break;
    }

    // Default: box
    return RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  }

  /**
   * Elimina un rigid body
   */
  _removeRigidBody(entity) {
    const bodyData = this.rigidBodies.get(entity);
    if (bodyData && this.physicsWorld) {
      this.physicsWorld.removeRigidBody(bodyData.body);
      this.rigidBodies.delete(entity);
    }
  }

  /**
   * Elimina colliders
   */
  _removeCollider(entity) {
    const entityColliders = this.colliders.get(entity);
    if (entityColliders) {
      entityColliders.forEach(({ collider }) => {
        if (this.physicsWorld) {
          this.physicsWorld.removeCollider(collider, true);
        }
      });
      this.colliders.delete(entity);
    }
  }

  /**
   * Actualiza el sistema físico
   */
  update(deltaTime) {
    if (!this._initialized || !this.physicsWorld) return;

    // Actualizar rigid bodies kinematic desde transform
    this.rigidBodies.forEach((bodyData, entity) => {
      const transform = entity.getComponent('transform');
      if (!transform) return;

      const { body, type } = bodyData;

      // Actualizar kinematic bodies desde transform
      if (type === 'kinematic' || type === 'kinematicVelocity') {
        body.setTranslation(
          transform.x,
          transform.y,
          transform.z,
          true
        );
        body.setRotation(
          {
            x: transform.rotationX || 0,
            y: transform.rotationY || 0,
            z: transform.rotationZ || 0,
            w: 1
          },
          true
        );
      }
    });

    // Avanzar simulación física
    this.physicsWorld.step();

    // Aplicar transformaciones de vuelta a las entidades
    this.rigidBodies.forEach((bodyData, entity) => {
      const transform = entity.getComponent('transform');
      if (!transform || bodyData.type === 'kinematic') return;

      const { body } = bodyData;

      // Obtener posición
      const translation = body.translation();
      transform.x = translation.x;
      transform.y = translation.y;
      transform.z = translation.z;

      // Obtener rotación
      const rotation = body.rotation();
      transform.rotationX = rotation.x;
      transform.rotationY = rotation.y;
      transform.rotationZ = rotation.z;
    });
  }

  /**
   * Aplica fuerza a un rigid body
   */
  applyForce(entity, force, wakeUp = true) {
    const bodyData = this.rigidBodies.get(entity);
    if (bodyData && bodyData.body) {
      bodyData.body.applyForce(
        { x: force.x, y: force.y, z: force.z },
        wakeUp
      );
    }
  }

  /**
   * Aplica impulso a un rigid body
   */
  applyImpulse(entity, impulse, wakeUp = true) {
    const bodyData = this.rigidBodies.get(entity);
    if (bodyData && bodyData.body) {
      bodyData.body.applyImpulse(
        { x: impulse.x, y: impulse.y, z: impulse.z },
        wakeUp
      );
    }
  }

  /**
   * Aplica torque a un rigid body
   */
  applyTorque(entity, torque, wakeUp = true) {
    const bodyData = this.rigidBodies.get(entity);
    if (bodyData && bodyData.body) {
      bodyData.body.applyTorque(
        { x: torque.x, y: torque.y, z: torque.z },
        wakeUp
      );
    }
  }

  /**
   * Establece velocidad lineal
   */
  setLinearVelocity(entity, velocity) {
    const bodyData = this.rigidBodies.get(entity);
    if (bodyData && bodyData.body) {
      bodyData.body.setLinvel(
        { x: velocity.x, y: velocity.y, z: velocity.z },
        true
      );
    }
  }

  /**
   * Establece velocidad angular
   */
  setAngularVelocity(entity, velocity) {
    const bodyData = this.rigidBodies.get(entity);
    if (bodyData && bodyData.body) {
      bodyData.body.setAngvel(
        { x: velocity.x, y: velocity.y, z: velocity.z },
        true
      );
    }
  }

  /**
   * Obtiene velocidad lineal
   */
  getLinearVelocity(entity) {
    const bodyData = this.rigidBodies.get(entity);
    if (bodyData && bodyData.body) {
      const vel = bodyData.body.linvel();
      return { x: vel.x, y: vel.y, z: vel.z };
    }
    return { x: 0, y: 0, z: 0 };
  }

  /**
   * Obtiene velocidad angular
   */
  getAngularVelocity(entity) {
    const bodyData = this.rigidBodies.get(entity);
    if (bodyData && bodyData.body) {
      const vel = bodyData.body.angvel();
      return { x: vel.x, y: vel.y, z: vel.z };
    }
    return { x: 0, y: 0, z: 0 };
  }

  /**
   * Raycast
   */
  raycast(origin, direction, maxDistance = 100) {
    if (!this._initialized || !this.physicsWorld) return null;

    const RAPIER = window.RAPIER;
    const ray = new RAPIER.Ray(
      { x: origin.x, y: origin.y, z: origin.z },
      { x: direction.x, y: direction.y, z: direction.z }
    );

    const hit = this.physicsWorld.castRay(ray, maxDistance, true);

    if (hit) {
      return {
        collider: hit.collider,
        toi: hit.toi,
        ...hit
      };
    }

    return null;
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats() {
    return {
      initialized: this._initialized,
      rigidBodies: this.rigidBodies.size,
      colliders: Array.from(this.colliders.values()).reduce(
        (sum, colliders) => sum + colliders.length,
        0
      ),
      joints: this.joints.size
    };
  }

  /**
   * Character Controller - Movimiento suave para jugadores
   * Evita que el personaje se atascque en las esquinas
   */
  createCharacterController(entity, config = {}) {
    if (!this._initialized) {
      console.warn('PhysicsSystem must be initialized before creating character controllers');
      return null;
    }

    const RAPIER = window.RAPIER;

    // Configuración del capsule collider
    const radius = config.radius || 0.5;
    const height = config.height || 1.8;
    const stepHeight = config.stepHeight || 0.3;

    // Crear kinematic character controller
    const controller = RAPIER.KinematicCharacterController.new(radius, height, stepHeight);

    // Configurar propiedades
    if (config.offset) {
      controller.setOffset(config.offset);
    }
    if (config.slopeLimit) {
      controller.setSlopeLimit(config.slopeLimit);
    }
    if (config.wallSlideSpeed) {
      controller.setWallSlideSpeed(config.wallSlideSpeed);
    }
    if (config.maxVelocity) {
      controller.setMaxVelocity(config.maxVelocity);
    }

    // Aplicar a la entidad
    const characterControllers = entity.getComponent('characterControllers') || [];
    characterControllers.push({
      controller,
      radius,
      height,
      stepHeight,
      config
    });
    entity.addComponent('characterControllers', characterControllers);

    return controller;
  }

  /**
   * Mueve un character controller
   */
  moveCharacterController(entity, displacement, options = {}) {
    const characterControllers = entity.getComponent('characterControllers');
    if (!characterControllers || characterControllers.length === 0) {
      return false;
    }

    const controller = characterControllers[0].controller;
    const movement = {
      x: displacement.x,
      y: displacement.y,
      z: displacement.z
    };

    try {
      controller.computeColliderMovement(displacement);
      const correctedMovement = controller.movement();

      // Aplicar corrección a la entidad
      const transform = entity.getComponent('transform');
      if (transform) {
        transform.x += correctedMovement.x;
        transform.y += correctedMovement.y;
        transform.z += correctedMovement.z;

        // Actualizar kinematic body
        const bodyData = this.rigidBodies.get(entity);
        if (bodyData && bodyData.body) {
          bodyData.body.setTranslation(
            transform.x,
            transform.y,
            transform.z,
            true
          );
        }
      }

      // Eventos de colisión
      if (options.onCollision) {
        controller.collisions().forEach(collision => {
          options.onCollision(collision);
        });
      }

      return true;
    } catch (error) {
      console.error('Error moving character controller:', error);
      return false;
    }
  }

  /**
   * Triggers - Detectan colisiones sin bloquear
   */
  createTrigger(entity, config = {}) {
    if (!this._initialized) return null;

    const colliderDesc = this._getTriggerDescription(config);
    const trigger = this.physicsWorld.createCollider(colliderDesc);

    // Marcar como trigger
    trigger.setSensor(true);

    if (!this.triggers) {
      this.triggers = new Map();
    }

    this.triggers.set(entity, {
      collider: trigger,
      config,
      onEnter: config.onEnter || null,
      onExit: config.onExit || null,
      onStay: config.onStay || null,
      active: true
    });

    return trigger;
  }

  /**
   * Obtiene descripción para trigger
   */
  _getTriggerDescription(config) {
    const RAPIER = window.RAPIER;
    const { shape, ...shapeConfig } = config;

    switch (shape) {
      case 'box':
        const size = shapeConfig.size || [1, 1, 1];
        return RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2)
          .setSensor(true);

      case 'sphere':
        const radius = shapeConfig.radius || 0.5;
        return RAPIER.ColliderDesc.ball(radius).setSensor(true);

      case 'cylinder':
        const cylRadius = shapeConfig.radius || 0.5;
        const cylHeight = shapeConfig.height || 1;
        return RAPIER.ColliderDesc.cylinder(cylHeight / 2, cylRadius)
          .setSensor(true);

      default:
        return RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setSensor(true);
    }
  }

  /**
   * Remueve un trigger
   */
  removeTrigger(entity) {
    if (!this.triggers || !this.triggers.has(entity)) return;

    const triggerData = this.triggers.get(entity);
    if (triggerData.collider && this.physicsWorld) {
      this.physicsWorld.removeCollider(triggerData.collider, true);
    }

    this.triggers.delete(entity);
  }

  /**
   * Activa/desactiva un trigger
   */
  setTriggerActive(entity, active) {
    const triggerData = this.triggers?.get(entity);
    if (triggerData) {
      triggerData.active = active;
    }
  }

  /**
   * Physics Materials - Para fricción y rebote personalizados
   */
  createPhysicsMaterial(config = {}) {
    if (!this._initialized) return null;

    const material = {
      id: config.id || 'mat_' + Math.random().toString(36).substr(2, 9),
      name: config.name || 'Unnamed Material',
      friction: config.friction !== undefined ? config.friction : 0.5,
      restitution: config.restitution !== undefined ? config.restitution : 0.0,
      rollingFriction: config.rollingFriction || 0.0,
      spinningFriction: config.spinningFriction || 0.0,
      restitutionCombineRule: config.restitutionCombineRule || 'average',
      frictionCombineRule: config.frictionCombineRule || 'average'
    };

    if (!this.materials) {
      this.materials = new Map();
    }

    this.materials.set(material.id, material);
    return material;
  }

  /**
   * Obtiene un physics material
   */
  getPhysicsMaterial(materialId) {
    return this.materials?.get(materialId) || null;
  }

  /**
   * Aplica material a un collider
   */
  applyMaterialToCollider(entity, colliderIndex, materialId) {
    const material = this.getPhysicsMaterial(materialId);
    if (!material) return false;

    const entityColliders = this.colliders.get(entity);
    if (!entityColliders || !entityColliders[colliderIndex]) return false;

    const collider = entityColliders[colliderIndex].collider;

    collider.setFriction(material.friction);
    collider.setRestitution(material.restitution);
    collider.setRollingFriction(material.rollingFriction);
    collider.setSpinningFriction(material.spinningFriction);

    return true;
  }

  /**
   * Joints - Conexiones entre objetos
   */
  createJoint(entityA, entityB, jointConfig = {}) {
    if (!this._initialized) return null;

    const RAPIER = window.RAPIER;
    const bodyDataA = this.rigidBodies.get(entityA);
    const bodyDataB = this.rigidBodies.get(entityB);

    if (!bodyDataA || !bodyDataB) {
      console.warn('Both entities must have rigid bodies');
      return null;
    }

    let joint = null;

    switch (jointConfig.type) {
      case 'fixed':
        joint = RAPIER.JointData.fixed(
          { x: jointConfig.anchorA?.x || 0, y: jointConfig.anchorA?.y || 0, z: jointConfig.anchorA?.z || 0 },
          { x: jointConfig.anchorB?.x || 0, y: jointConfig.anchorB?.y || 0, z: jointConfig.anchorB?.z || 0 }
        );
        break;

      case 'ball':
        joint = RAPIER.JointData.ball(
          { x: jointConfig.anchorA?.x || 0, y: jointConfig.anchorA?.y || 0, z: jointConfig.anchorA?.z || 0 },
          { x: jointConfig.anchorB?.x || 0, y: jointConfig.anchorB?.y || 0, z: jointConfig.anchorB?.z || 0 }
        );
        break;

      case 'hinge':
        joint = RAPIER.JointData.hinge(
          { x: jointConfig.anchorA?.x || 0, y: jointConfig.anchorA?.y || 0, z: jointConfig.anchorA?.z || 0 },
          { x: jointConfig.axisA?.x || 0, y: jointConfig.axisA?.y || 0, z: jointConfig.axisA?.z || 1 },
          { x: jointConfig.anchorB?.x || 0, y: jointConfig.anchorB?.y || 0, z: jointConfig.anchorB?.z || 0 },
          { x: jointConfig.axisB?.x || 0, y: jointConfig.axisB?.y || 0, z: jointConfig.axisB?.z || 1 }
        );
        break;

      default:
        console.warn('Unknown joint type:', jointConfig.type);
        return null;
    }

    const createdJoint = this.physicsWorld.createImpulseJoint(
      joint,
      bodyDataA.body,
      bodyDataB.body,
      jointConfig.collisionConnected !== false
    );

    const jointId = 'joint_' + Math.random().toString(36).substr(2, 9);
    this.joints.set(jointId, {
      joint: createdJoint,
      type: jointConfig.type,
      entityA,
      entityB,
      config: jointConfig
    });

    return jointId;
  }

  /**
   * Remueve un joint
   */
  removeJoint(jointId) {
    const jointData = this.joints.get(jointId);
    if (jointData && this.physicsWorld) {
      this.physicsWorld.removeImpulseJoint(jointData.joint, true);
      this.joints.delete(jointId);
    }
  }

  /**
   * Collision callbacks
   */
  _setupCollisionCallbacks() {
    if (!this._initialized) return;

    // En Rapier, los eventos de colisión se manejan en el update
    this.on('collisionStart', (data) => {
      // Trigger enter
      const triggerData = this.triggers?.get(data.entity);
      if (triggerData && triggerData.active && triggerData.onEnter) {
        triggerData.onEnter(data);
      }
    });

    this.on('collisionEnd', (data) => {
      // Trigger exit
      const triggerData = this.triggers?.get(data.entity);
      if (triggerData && triggerData.active && triggerData.onExit) {
        triggerData.onExit(data);
      }
    });
  }

  /**
   * Event listeners
   */
  on(event, callback) {
    return this.emitter.on(event, callback);
  }

  off(event, callback) {
    this.emitter.off(event, callback);
  }

  /**
   * Cleanup
   */
  destroy() {
    // Limpiar character controllers
    // (se limpian automáticamente al remover rigid bodies)

    // Limpiar triggers
    if (this.triggers) {
      this.triggers.forEach((triggerData, entity) => {
        if (triggerData.collider && this.physicsWorld) {
          this.physicsWorld.removeCollider(triggerData.collider, true);
        }
      });
      this.triggers.clear();
    }

    // Limpiar materials
    if (this.materials) {
      this.materials.clear();
    }

    // Limpiar joints
    if (this.joints) {
      this.joints.forEach((jointData, jointId) => {
        this.removeJoint(jointId);
      });
    }

    if (this.physicsWorld) {
      // Limpiar todos los rigid bodies
      this.rigidBodies.forEach((bodyData, entity) => {
        this._removeRigidBody(entity);
      });

      // Limpiar world
      this.physicsWorld.free();
      this.physicsWorld = null;
    }

    this.rigidBodies.clear();
    this.colliders.clear();
    this.joints.clear();
    this.emitter.removeAllListeners();

    super.destroy();
  }
}

export default PhysicsSystem;
