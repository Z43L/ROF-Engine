/**
 * Light Component
 * Representa una fuente de luz en la escena 3D
 */

import Component from '../../core/Component.js';
import * as THREE from 'three';

/**
 * Componente Light - Datos de una fuente de luz
 */
export class LightComponent extends Component {
  constructor(options = {}) {
    super('light');

    // Tipo de luz
    this.lightType = options.lightType || 'directional'; // directional, point, spot, ambient, hemisphere

    // Propiedades básicas
    this.color = options.color || 0xffffff;
    this.intensity = options.intensity !== undefined ? options.intensity : 1;
    this.distance = options.distance || 0; // 0 = infinito
    this.decay = options.decay !== undefined ? options.decay : 2;

    // Posición y dirección (para directional y spot)
    this.position = options.position || { x: 0, y: 10, z: 0 };
    this.target = options.target || null;
    this.direction = options.direction || { x: 0, y: -1, z: 0 };

    // Para spotlights
    this.angle = options.angle !== undefined ? options.angle : Math.PI / 6; // 30 grados
    this.penumbra = options.penumbra !== undefined ? options.penumbra : 0; // 0-1

    // Para ambient lights
    this.groundColor = options.groundColor || 0x444444;

    // Sombras
    this.castShadow = options.castShadow !== false;
    this.shadowMapSize = options.shadowMapSize || 1024;
    this.shadowCamera = options.shadowCamera || {};
    this.shadowBias = options.shadowBias || 0;
    this.shadowNormalBias = options.shadowNormalBias || 0;

    // Visualización
    this.visible = options.visible !== false;
    this.helper = options.helper !== false; // Mostrar helper visual

    // Referencias Three.js
    this.light = null;
    this.helperObject = null;
  }

  /**
   * Crea la luz Three.js
   */
  createLight() {
    switch (this.lightType) {
      case 'ambient':
        this.light = new THREE.AmbientLight(this.color, this.intensity);
        break;

      case 'directional':
        this.light = new THREE.DirectionalLight(this.color, this.intensity);
        this.light.position.set(this.position.x, this.position.y, this.position.z);
        this.light.target.position.set(
          this.target?.x || 0,
          this.target?.y || 0,
          this.target?.z || 0
        );
        this.light.target.updateMatrixWorld();
        break;

      case 'point':
        this.light = new THREE.PointLight(
          this.color,
          this.intensity,
          this.distance,
          this.decay
        );
        this.light.position.set(this.position.x, this.position.y, this.position.z);
        break;

      case 'spot':
        this.light = new THREE.SpotLight(
          this.color,
          this.intensity,
          this.distance,
          this.angle,
          this.penumbra,
          this.decay
        );
        this.light.position.set(this.position.x, this.position.y, this.position.z);
        this.light.target.position.set(
          this.target?.x || 0,
          this.target?.y || 0,
          this.target?.z || 0
        );
        this.light.target.updateMatrixWorld();
        break;

      case 'hemisphere':
        this.light = new THREE.HemisphereLight(this.color, this.groundColor, this.intensity);
        break;

      default:
        this.light = new THREE.DirectionalLight(this.color, this.intensity);
    }

    // Configurar sombras
    this._configureShadows();

    // Configurar visibilidad
    this.light.visible = this.visible;

    return this.light;
  }

  /**
   * Configura las sombras de la luz
   */
  _configureShadows() {
    if (!this.light) return;

    if (this.castShadow) {
      this.light.castShadow = true;

      // Configurar shadow map
      this.light.shadow.mapSize.width = this.shadowMapSize;
      this.light.shadow.mapSize.height = this.shadowMapSize;

      // Configurar cámara de sombras
      if (this.light.shadow.camera) {
        const camera = this.light.shadow.camera;
        const { left, right, top, bottom, near, far } = this.shadowCamera;

        if (left !== undefined) camera.left = left;
        if (right !== undefined) camera.right = right;
        if (top !== undefined) camera.top = top;
        if (bottom !== undefined) camera.bottom = bottom;
        if (near !== undefined) camera.near = near;
        if (far !== undefined) camera.far = far;

        camera.updateProjectionMatrix();
      }

      // Configurar bias
      this.light.shadow.bias = this.shadowBias;
      this.light.shadow.normalBias = this.shadowNormalBias;
    } else {
      this.light.castShadow = false;
    }
  }

  /**
   * Crea un helper visual para la luz
   */
  createHelper() {
    if (!this.light || !this.helper) return null;

    let helper;

    switch (this.lightType) {
      case 'directional':
        helper = new THREE.DirectionalLightHelper(this.light, 1);
        break;

      case 'point':
        helper = new THREE.PointLightHelper(this.light, 1);
        break;

      case 'spot':
        helper = new THREE.SpotLightHelper(this.light);
        break;

      default:
        return null;
    }

    this.helperObject = helper;
    return helper;
  }

  /**
   * Actualiza la posición de la luz
   */
  updatePosition(position) {
    this.position = { ...this.position, ...position };

    if (this.light) {
      this.light.position.set(this.position.x, this.position.y, this.position.z);

      if (this.lightType === 'directional' || this.lightType === 'spot') {
        this.light.target.updateMatrixWorld();
      }
    }
  }

  /**
   * Actualiza el objetivo de la luz
   */
  updateTarget(target) {
    this.target = { ...this.target, ...target };

    if (this.light && (this.lightType === 'directional' || this.lightType === 'spot')) {
      this.light.target.position.set(this.target.x, this.target.y, this.target.z);
      this.light.target.updateMatrixWorld();
    }
  }

  /**
   * Actualiza las propiedades de la luz
   */
  updateProperties(properties) {
    Object.assign(this, properties);

    if (this.light) {
      if (properties.color !== undefined) this.light.color.setHex(properties.color);
      if (properties.intensity !== undefined) this.light.intensity = properties.intensity;
      if (properties.distance !== undefined) this.light.distance = properties.distance;
      if (properties.decay !== undefined) this.light.decay = properties.decay;
      if (properties.angle !== undefined) this.light.angle = properties.angle;
      if (properties.penumbra !== undefined) this.light.penumbra = properties.penumbra;
      if (properties.visible !== undefined) this.light.visible = properties.visible;

      // Reconfigurar sombras si es necesario
      if (properties.castShadow !== undefined || properties.shadowMapSize !== undefined) {
        this._configureShadows();
      }
    }
  }

  /**
   * Actualiza el helper
   */
  updateHelper() {
    if (this.helperObject && this.light) {
      this.helperObject.update();
    }
  }

  /**
   * Libera los recursos
   */
  dispose() {
    if (this.helperObject) {
      this.helperObject.dispose();
      this.helperObject = null;
    }

    if (this.light) {
      this.light.dispose?.();
      this.light = null;
    }
  }

  /**
   * Serializa el componente
   */
  toJSON() {
    return {
      type: this.type,
      lightType: this.lightType,
      color: this.color,
      intensity: this.intensity,
      distance: this.distance,
      decay: this.decay,
      position: this.position,
      target: this.target,
      direction: this.direction,
      angle: this.angle,
      penumbra: this.penumbra,
      groundColor: this.groundColor,
      castShadow: this.castShadow,
      shadowMapSize: this.shadowMapSize,
      shadowCamera: this.shadowCamera,
      shadowBias: this.shadowBias,
      shadowNormalBias: this.shadowNormalBias,
      visible: this.visible,
      helper: this.helper
    };
  }
}

export default LightComponent;
