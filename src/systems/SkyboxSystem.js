/**
 * SkyboxSystem
 * Sistema para gestionar skyboxes y ambientes de escena
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';
import * as THREE from 'three';

/**
 * SkyboxSystem - Sistema de skybox y ambientes
 */
class SkyboxSystem extends System {
  constructor() {
    super('SkyboxSystem', [], 5); // Prioridad muy baja

    this.emitter = new EventEmitter();

    // Gestión de skybox
    this.skybox = null;
    this.environment = null;
    this.background = null;

    // Configuración
    this.config = {
      type: 'color', // color, texture, gradient, procedural
      color: 0x87CEEB, // Color por defecto (sky blue)
      texture: null,
      gradient: {
        top: 0x87CEEB,
        bottom: 0xE0F6FF
      },
      procedural: {
        type: 'sky',
        turbidity: 10,
        rayleigh: 2,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8,
        elevation: 2,
        azimuth: 0.25
      }
    };

    // Lighting environment
    this.environmentIntensity = 1;
    this.backgroundIntensity = 1;

    // Referencias Three.js
    this.scene = null;

    // Estadísticas
    this.stats = {
      hasSkybox: false,
      hasEnvironment: false,
      hasBackground: false,
      type: 'none'
    };
  }

  /**
   * Inicializa el sistema
   */
  init(world) {
    super.init(world);
    console.log('✅ SkyboxSystem initialized');
  }

  /**
   * Actualiza el sistema
   */
  update(deltaTime) {
    // Actualizar skybox procedural si está habilitado
    if (this.config.type === 'procedural' && this.skybox) {
      this._updateProceduralSkybox(deltaTime);
    }
  }

  /**
   * Establece un skybox de color sólido
   */
  setColor(color) {
    this.config.type = 'color';
    this.config.color = color;

    if (this.scene) {
      this.scene.background = new THREE.Color(color);
      this.stats.type = 'color';
      this.stats.hasBackground = true;
      this.emitter.emit('skyboxChanged', { type: 'color', color });
    }
  }

  /**
   * Establece un skybox con textura
   */
  setTexture(texture, isEquirectangular = false) {
    this.config.type = 'texture';
    this.config.texture = texture;

    if (this.scene) {
      if (isEquirectangular) {
        // Textura equirectangular (360)
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = texture;
        this.scene.environment = texture;
      } else {
        // Cubemap
        texture.mapping = THREE.CubeReflectionMapping;
        this.scene.background = texture;
      }

      this.stats.type = 'texture';
      this.stats.hasSkybox = true;
      this.stats.hasBackground = true;
      this.emitter.emit('skyboxChanged', { type: 'texture' });
    }
  }

  /**
   * Establece un skybox con gradiente
   */
  setGradient(topColor, bottomColor) {
    this.config.type = 'gradient';
    this.config.gradient.top = topColor;
    this.config.gradient.bottom = bottomColor;

    if (this.scene) {
      const gradientTexture = this._createGradientTexture(topColor, bottomColor);
      gradientTexture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = gradientTexture;
      this.scene.environment = gradientTexture;

      this.stats.type = 'gradient';
      this.stats.hasBackground = true;
      this.emitter.emit('skyboxChanged', { type: 'gradient', topColor, bottomColor });
    }
  }

  /**
   * Crea una textura de gradiente
   */
  _createGradientTexture(topColor, bottomColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    // Crear gradiente
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, `#${topColor.toString(16).padStart(6, '0')}`);
    gradient.addColorStop(1, `#${bottomColor.toString(16).padStart(6, '0')}`);

    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Establece un skybox procedural (físicamente basado)
   */
  setProceduralSkybox(options = {}) {
    this.config.type = 'procedural';
    Object.assign(this.config.procedural, options);

    if (this.scene) {
      this._createProceduralSkybox();
      this.stats.type = 'procedural';
      this.emitter.emit('skyboxChanged', { type: 'procedural' });
    }
  }

  /**
   * Crea un skybox procedural
   */
  _createProceduralSkybox() {
    if (!THREE.Sky) {
      console.warn('THREE.Sky no está disponible. Asegúrate de importar three/examples/jsm/objects/Sky.js');
      return;
    }

    // Crear skybox procedural
    this.skybox = new THREE.Sky();
    this.skybox.scale.setScalar(450000);

    // Aplicar parámetros
    const { turbidity, rayleigh, mieCoefficient, mieDirectionalG, elevation, azimuth } = this.config.procedural;

    this.skybox.material.uniforms['turbidity'].value = turbidity;
    this.skybox.material.uniforms['rayleigh'].value = rayleigh;
    this.skybox.material.uniforms['mieCoefficient'].value = mieCoefficient;
    this.skybox.material.uniforms['mieDirectionalG'].value = mieDirectionalG;

    // Configurar elevación y azimuth
    const sun = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    sun.setFromSphericalCoords(1, phi, theta);

    this.skybox.material.uniforms['sunPosition'].value.copy(sun);

    // Agregar a la escena
    if (this.scene && !this.scene.children.includes(this.skybox)) {
      this.scene.add(this.skybox);
    }

    this.stats.hasSkybox = true;
  }

  /**
   * Actualiza el skybox procedural
   */
  _updateProceduralSkybox(deltaTime) {
    // TODO: Animar parámetros del skybox si es necesario
    // Por ejemplo, cambio de hora del día
  }

  /**
   * Establece ambiente de iluminación (IBL - Image Based Lighting)
   */
  setEnvironment(texture, intensity = 1) {
    this.environmentIntensity = intensity;

    if (this.scene) {
      this.scene.environment = texture;
      this.stats.hasEnvironment = true;
      this.emitter.emit('environmentChanged', { intensity });
    }
  }

  /**
   * Establece el fondo de la escena
   */
  setBackground(background) {
    if (this.scene) {
      this.scene.background = background;
      this.stats.hasBackground = true;
      this.emitter.emit('backgroundChanged', { background });
    }
  }

  /**
   * Carga un skybox desde archivos
   */
  async loadSkyboxFromFiles({
    posX,
    negX,
    posY,
    negY,
    posZ,
    negZ
  }) {
    const loader = new THREE.CubeTextureLoader();

    try {
      const textures = await Promise.all([
        loader.loadAsync(posX),
        loader.loadAsync(negX),
        loader.loadAsync(posY),
        loader.loadAsync(negY),
        loader.loadAsync(posZ),
        loader.loadAsync(negZ)
      ]);

      const cubeTexture = new THREE.CubeTexture(textures);
      this.setTexture(cubeTexture, false);

      return cubeTexture;
    } catch (error) {
      console.error('Error loading skybox:', error);
      throw error;
    }
  }

  /**
   * Carga un ambiente equirectangular
   */
  async loadEnvironment(texturePath) {
    const loader = new THREE.TextureLoader();

    try {
      const texture = await loader.loadAsync(texturePath);
      this.setTexture(texture, true);
      return texture;
    } catch (error) {
      console.error('Error loading environment:', error);
      throw error;
    }
  }

  /**
   * Crea un skybox de cubo sólido
   */
  createSolidSkybox(size = 1000, color = 0x000000) {
    const materials = [];
    for (let i = 0; i < 6; i++) {
      materials.push(new THREE.MeshBasicMaterial({
        color,
        side: THREE.BackSide
      }));
    }

    const skybox = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      materials
    );

    return skybox;
  }

  /**
   * Anima el skybox (rotación)
   */
  animateSkybox(speed = 0.1) {
    if (this.skybox) {
      this.skybox.rotation.y += speed * 0.01;
    }
  }

  /**
   * Establece la escena
   */
  setScene(scene) {
    this.scene = scene;

    // Aplicar configuración actual a la nueva escena
    this._applyCurrentConfig();
  }

  /**
   * Aplica la configuración actual
   */
  _applyCurrentConfig() {
    if (!this.scene) return;

    switch (this.config.type) {
      case 'color':
        this.scene.background = new THREE.Color(this.config.color);
        break;
      case 'gradient':
        this.setGradient(this.config.gradient.top, this.config.gradient.bottom);
        break;
      case 'procedural':
        this._createProceduralSkybox();
        break;
    }
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    return {
      ...this.stats,
      configType: this.config.type,
      environmentIntensity: this.environmentIntensity
    };
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
    if (this.skybox && this.scene) {
      this.scene.remove(this.skybox);
    }

    if (this.background && this.background.dispose) {
      this.background.dispose();
    }

    if (this.environment && this.environment.dispose) {
      this.environment.dispose();
    }

    this.skybox = null;
    this.background = null;
    this.environment = null;
    this.scene = null;

    this.emitter.removeAllListeners();

    super.destroy();
  }
}

export default SkyboxSystem;