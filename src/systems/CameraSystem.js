/**
 * CameraSystem
 * Sistema avanzado de cámaras para el engine
 * Maneja múltiples cámaras, controles, interpolación y transiciones
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';
import * as THREE from 'three';

/**
 * CameraSystem - Sistema de gestión de cámaras
 */
class CameraSystem extends System {
  constructor() {
    super('CameraSystem', ['camera'], 70); // Alta prioridad

    this.emitter = new EventEmitter();

    // Gestión de cámaras
    this.cameras = new Map(); // entity -> camera data
    this.activeCamera = null;
    this.cameraStack = []; // Para transiciones

    // Controles de cámara
    this.controls = new Map(); // camera -> controls
    this.controlSettings = {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 1,
      maxDistance: 100,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
      enableZoom: true,
      enablePan: true,
      enableRotate: true,
      zoomSpeed: 1.0,
      panSpeed: 1.0,
      rotateSpeed: 1.0
    };

    // Interpolación y transiciones
    this.transitions = new Map(); // cameraId -> transition
    this.lerpSpeed = 0.1;

    // Configuración multiplataforma
    this.platformSettings = {
      web: {
        enablePointerLock: true,
        enableKeyboardControls: true
      },
      mobile: {
        enableTouchControls: true,
        gestureControls: true,
        autoRotate: false
      },
      native: {
        enableGyroscope: true,
        enableDeviceOrientation: true
      }
    };

    // Estadísticas
    this.stats = {
      totalCameras: 0,
      activeCamera: null,
      isTransitioning: false,
      fps: 60
    };

    // Referencias Three.js
    this.canvas = null;
    this.scene = null;
  }

  /**
   * Inicializa el sistema
   */
  init(world) {
    super.init(world);
    console.log('✅ CameraSystem initialized');
  }

  /**
   * Registra una entidad con cámara
   */
  onEntityAdded(entity) {
    const cameraComponent = entity.getComponent('camera');

    if (!cameraComponent) return;

    // Crear cámara
    const cameraData = this._createCamera(entity, cameraComponent);
    if (!cameraData) return;

    this.cameras.set(entity, cameraData);

    // Si es la primera cámara, activarla
    if (this.cameras.size === 1) {
      this.setActiveCamera(entity);
    }

    // Actualizar estadísticas
    this.stats.totalCameras = this.cameras.size;

    // Emitir evento
    this.emitter.emit('cameraAdded', { entity, camera: cameraData });
  }

  /**
   * Elimina una entidad del sistema
   */
  onEntityRemoved(entity) {
    const cameraData = this.cameras.get(entity);
    if (!cameraData) return;

    // Si es la cámara activa, desactivar
    if (this.activeCamera === entity) {
      this.activeCamera = null;
    }

    // Limpiar controles
    this._disposeCamera(cameraData);

    this.cameras.delete(entity);

    // Actualizar estadísticas
    this.stats.totalCameras = this.cameras.size;

    // Emitir evento
    this.emitter.emit('cameraRemoved', { entity, camera: cameraData });
  }

  /**
   * Actualiza el sistema
   */
  update(deltaTime) {
    // Actualizar transiciones
    this._updateTransitions(deltaTime);

    // Actualizar controles activos
    this._updateActiveControls(deltaTime);

    // Actualizar estadísticas de FPS
    this._updateFPS(deltaTime);
  }

  /**
   * Crea una cámara a partir del componente
   */
  _createCamera(entity, cameraComponent) {
    try {
      // Crear cámara según el tipo
      let camera;

      switch (cameraComponent.type) {
        case 'perspective':
          camera = new THREE.PerspectiveCamera(
            cameraComponent.fov || 75,
            cameraComponent.aspect || (window.innerWidth / window.innerHeight),
            cameraComponent.near || 0.1,
            cameraComponent.far || 1000
          );
          break;

        case 'orthographic':
          const { left, right, top, bottom } = cameraComponent;
          camera = new THREE.OrthographicCamera(
            left || -1,
            right || 1,
            top || 1,
            bottom || -1,
            cameraComponent.near || 0.1,
            cameraComponent.far || 1000
          );
          break;

        case 'cubemap':
          camera = new THREE.CubeCamera(
            cameraComponent.near || 0.1,
            cameraComponent.far || 1000,
            cameraComponent.resolution || 256
          );
          break;

        default:
          camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      }

      // Configurar posición inicial
      if (cameraComponent.position) {
        camera.position.set(
          cameraComponent.position.x || 0,
          cameraComponent.position.y || 0,
          cameraComponent.position.z || 0
        );
      }

      // Configurar rotación
      if (cameraComponent.rotation) {
        camera.rotation.set(
          cameraComponent.rotation.x || 0,
          cameraComponent.rotation.y || 0,
          cameraComponent.rotation.z || 0
        );
      }

      // Configurar target (para cámaras que miran a un punto)
      if (cameraComponent.target) {
        camera.lookAt(
          cameraComponent.target.x || 0,
          cameraComponent.target.y || 0,
          cameraComponent.target.z || 0
        );
      }

      // Aplicar configuraciones específicas
      camera.visible = cameraComponent.visible !== false;
      camera.layers = cameraComponent.layers || 0;

      const cameraData = {
        camera,
        component: cameraComponent,
        controls: null,
        isActive: false,
        transitionData: null
      };

      // Crear controles si está habilitado
      if (cameraComponent.enableControls) {
        this._createControls(cameraData, cameraComponent);
      }

      // Agregar a la escena si existe
      if (this.scene) {
        this.scene.add(camera);
      }

      return cameraData;
    } catch (error) {
      console.error('Error creating camera:', error);
      return null;
    }
  }

  /**
   * Crea controles para la cámara
   */
  _createControls(cameraData, cameraComponent) {
    // TODO: Implementar controles específicos según plataforma
    // Por ahora, controles básicos de orbit
    cameraData.controls = {
      enabled: true,
      target: cameraComponent.target || new THREE.Vector3(0, 0, 0),
      distance: cameraComponent.distance || 10,
      azimuthAngle: 0,
      polarAngle: Math.PI / 2,
      // Controles touch para móvil
      touches: {
        NONE: 0,
        ONE: 1,
        TWO: 2
      }
    };
  }

  /**
   * Actualiza controles activos
   */
  _updateActiveControls(deltaTime) {
    if (!this.activeCamera) return;

    const cameraData = this.cameras.get(this.activeCamera);
    if (!cameraData || !cameraData.controls) return;

    // TODO: Implementar controles específicos según plataforma
    // Web: Mouse y teclado
    // Móvil: Touch y gestos
    // Native: Gyroscope, accelerometer
  }

  /**
   * Actualiza transiciones
   */
  _updateTransitions(deltaTime) {
    this.transitions.forEach((transition, cameraId) => {
      if (!transition.startTime) {
        transition.startTime = performance.now();
        return;
      }

      const elapsed = performance.now() - transition.startTime;
      const progress = Math.min(elapsed / transition.duration, 1);

      // Interpolación suave
      const easedProgress = this._easeInOutCubic(progress);

      // Aplicar interpolación
      const camera = this.cameras.get(cameraId)?.camera;
      if (camera && transition.from && transition.to) {
        camera.position.lerpVectors(transition.from.position, transition.to.position, easedProgress);

        if (transition.from.target && transition.to.target) {
          const target = new THREE.Vector3().lerpVectors(
            new THREE.Vector3(transition.from.target.x, transition.from.target.y, transition.from.target.z),
            new THREE.Vector3(transition.to.target.x, transition.to.target.y, transition.to.target.z),
            easedProgress
          );
          camera.lookAt(target);
        }
      }

      // Completar transición
      if (progress >= 1) {
        this.transitions.delete(cameraId);
        this.stats.isTransitioning = false;
        this.emitter.emit('transitionComplete', { cameraId });
      }
    });
  }

  /**
   * Función de easing para transiciones
   */
  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Establece la cámara activa
   */
  setActiveCamera(entity) {
    if (!this.cameras.has(entity)) {
      console.warn('Camera not found:', entity);
      return false;
    }

    const previousCamera = this.activeCamera;
    this.activeCamera = entity;

    // Actualizar flag isActive
    this.cameras.forEach((cameraData, camEntity) => {
      cameraData.isActive = (camEntity === entity);
    });

    // Actualizar estadísticas
    this.stats.activeCamera = entity;

    // Emitir evento
    this.emitter.emit('activeCameraChanged', {
      previous: previousCamera,
      current: entity
    });

    return true;
  }

  /**
   * Obtiene la cámara activa
   */
  getActiveCamera() {
    if (!this.activeCamera) return null;

    const cameraData = this.cameras.get(this.activeCamera);
    return cameraData ? cameraData.camera : null;
  }

  /**
   * Transiciona a otra cámara
   */
  transitionToCamera(entity, duration = 1000) {
    if (!this.cameras.has(entity)) {
      console.warn('Camera not found:', entity);
      return;
    }

    const activeData = this.cameras.get(this.activeCamera);
    const targetData = this.cameras.get(entity);

    if (!activeData || !targetData) return;

    const transition = {
      from: {
        position: activeData.camera.position.clone(),
        target: this._getCameraTarget(activeData)
      },
      to: {
        position: targetData.camera.position.clone(),
        target: this._getCameraTarget(targetData)
      },
      duration,
      startTime: null
    };

    this.transitions.set(entity, transition);
    this.stats.isTransitioning = true;

    // Cambiar a la cámara destino al final de la transición
    const onComplete = () => {
      this.setActiveCamera(entity);
      this.emitter.off('transitionComplete', onComplete);
    };

    this.emitter.on('transitionComplete', onComplete);
  }

  /**
   * Obtiene el target de una cámara
   */
  _getCameraTarget(cameraData) {
    if (cameraData.controls && cameraData.controls.target) {
      return cameraData.controls.target;
    }
    return new THREE.Vector3(0, 0, 0);
  }

  /**
   * Mueve la cámara activa
   */
  moveActiveCamera(position, duration = 0) {
    if (!this.activeCamera) return;

    const cameraData = this.cameras.get(this.activeCamera);
    if (!cameraData) return;

    if (duration > 0) {
      // Transición suave
      const transition = {
        from: {
          position: cameraData.camera.position.clone(),
          target: this._getCameraTarget(cameraData)
        },
        to: {
          position: new THREE.Vector3(position.x, position.y, position.z),
          target: this._getCameraTarget(cameraData)
        },
        duration,
        startTime: null
      };

      this.transitions.set(this.activeCamera, transition);
      this.stats.isTransitioning = true;
    } else {
      // Movimiento instantáneo
      cameraData.camera.position.set(position.x, position.y, position.z);
      cameraData.camera.lookAt(this._getCameraTarget(cameraData));
    }
  }

  /**
   * Hace zoom en la cámara activa
   */
  zoomActiveCamera(delta) {
    const cameraData = this.activeCamera ? this.cameras.get(this.activeCamera) : null;
    if (!cameraData || !cameraData.controls) return;

    cameraData.controls.distance = Math.max(
      this.controlSettings.minDistance,
      Math.min(this.controlSettings.maxDistance, cameraData.controls.distance + delta)
    );

    // Actualizar posición de la cámara
    this._updateCameraPosition(cameraData);
  }

  /**
   * Actualiza la posición de la cámara según sus controles
   */
  _updateCameraPosition(cameraData) {
    if (!cameraData.controls) return;

    const { distance, azimuthAngle, polarAngle, target } = cameraData.controls;
    const spherical = new THREE.Spherical(distance, polarAngle, azimuthAngle);

    const position = new THREE.Vector3().setFromSpherical(spherical);
    position.add(target);

    cameraData.camera.position.copy(position);
    cameraData.camera.lookAt(target);
  }

  /**
   * Configura el canvas para controles
   */
  setCanvas(canvas) {
    this.canvas = canvas;
  }

  /**
   * Configura la escena
   */
  setScene(scene) {
    this.scene = scene;

    // Agregar todas las cámaras existentes a la escena
    this.cameras.forEach(cameraData => {
      if (!this.scene.children.includes(cameraData.camera)) {
        this.scene.add(cameraData.camera);
      }
    });
  }

  /**
   * Obtiene todas las cámaras
   */
  getAllCameras() {
    return Array.from(this.cameras.values()).map(c => c.camera);
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    return {
      ...this.stats,
      totalTransitions: this.transitions.size,
      controlsEnabled: this.controls.size
    };
  }

  /**
   * Actualiza FPS
   */
  _updateFPS(deltaTime) {
    // Implementación básica de cálculo de FPS
    // Se puede mejorar con promediado de múltiples frames
  }

  /**
   * Libera recursos de una cámara
   */
  _disposeCamera(cameraData) {
    if (cameraData.controls) {
      // Limpiar controles específicos
      cameraData.controls = null;
    }

    if (cameraData.camera) {
      cameraData.camera.dispose?.();
    }
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
   * Limpieza final
   */
  destroy() {
    // Liberar todas las cámaras
    this.cameras.forEach(cameraData => this._disposeCamera(cameraData));
    this.cameras.clear();

    this.activeCamera = null;
    this.cameraStack = [];
    this.transitions.clear();
    this.controls.clear();

    this.emitter.removeAllListeners();

    super.destroy();
  }
}

export default CameraSystem;