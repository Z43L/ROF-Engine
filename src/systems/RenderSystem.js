/**
 * RenderSystem
 * Sistema principal de renderizado que coordina todo el proceso de dibujo
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';
import * as THREE from 'three';

/**
 * RenderSystem - Sistema principal de renderizado
 */
class RenderSystem extends System {
  constructor() {
    super('RenderSystem', ['transform'], 10); // Prioridad muy baja (ejecutar al final)

    this.emitter = new EventEmitter();

    // Escena y renderizador
    this.scene = null;
    this.renderer = null;
    this.camera = null;

    // Configuración de renderizado
    this.config = {
      antialias: true,
      shadowMap: {
        enabled: true,
        type: THREE.PCFSoftShadowMap
      },
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1,
      outputEncoding: THREE.sRGBEncoding,
      physicallyCorrectLights: true,
      useLegacyLights: false
    };

    // Sistemas relacionados
    this.meshSystem = null;
    this.lightSystem = null;

    // Control de frame
    this.isRendering = false;
    this.needsRender = true;
    this.frameCount = 0;

    // Estadísticas de renderizado
    this.stats = {
      frames: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      lights: 0,
      fps: 60,
      renderTime: 0
    };

    // Tiempo para FPS
    this._lastTime = 0;
    this._frameTimes = [];

    // Post-processing
    this.postProcessing = {
      enabled: false,
      effects: []
    };

    // Optimización
    this.culling = {
      frustum: true,
      occlusion: false
    };

    // Performance
    this.performance = {
      targetFPS: 60,
      adaptiveQuality: false,
      qualityLevel: 'high' // low, medium, high, ultra
    };
  }

  /**
   * Inicializa el sistema
   */
  init(world) {
    super.init(world);
    this._findRelatedSystems();
    console.log('✅ RenderSystem initialized');
  }

  /**
   * Encuentra sistemas relacionados
   */
  _findRelatedSystems() {
    if (this.world) {
      this.meshSystem = this.world.getSystem('MeshSystem');
      this.lightSystem = this.world.getSystem('LightSystem');
    }
  }

  /**
   * Establece la escena
   */
  setScene(scene) {
    this.scene = scene;

    // Conectar con LightSystem si existe
    if (this.lightSystem) {
      this.lightSystem.setScene(scene);
    }

    this.needsRender = true;
  }

  /**
   * Establece el renderizador
   */
  setRenderer(renderer) {
    this.renderer = renderer;

    if (renderer) {
      // Configurar renderizador
      this._configureRenderer();
    }

    this.needsRender = true;
  }

  /**
   * Establece la cámara
   */
  setCamera(camera) {
    this.camera = camera;
    this.needsRender = true;
  }

  /**
   * Configura el renderizador
   */
  _configureRenderer() {
    if (!this.renderer) return;

    // Configurar sombras
    this.renderer.shadowMap.enabled = this.config.shadowMap.enabled;
    this.renderer.shadowMap.type = this.config.shadowMap.type;

    // Configurar tone mapping
    this.renderer.toneMapping = this.config.toneMapping;
    this.renderer.toneMappingExposure = this.config.toneMappingExposure;

    // Configurar output encoding
    this.renderer.outputEncoding = this.config.outputEncoding;

    // Configurar luces
    this.renderer.physicallyCorrectLights = this.config.physicallyCorrectLights;

    console.log('✅ Renderer configured');
  }

  /**
   * Procesa una entidad (para compatibilidad con System base)
   */
  process(entities, deltaTime) {
    // No necesitamos procesar entidades individuales aquí
    // El renderizado se hace a nivel de escena
  }

  /**
   * Actualiza el sistema de renderizado
   */
  update(deltaTime) {
    if (!this.scene || !this.renderer || !this.camera) {
      return;
    }

    const startTime = performance.now();

    // Actualizar controles de cámara si existen
    this._updateCameraControls();

    // Aplicar optimizaciones
    this._applyOptimizations();

    // Renderizar
    this._render();

    // Actualizar estadísticas
    this._updateStats(startTime, deltaTime);

    this.frameCount++;
  }

  /**
   * Renderiza la escena
   */
  _render() {
    if (!this.scene || !this.renderer || !this.camera) return;

    try {
      // Renderizar con post-processing si está habilitado
      if (this.postProcessing.enabled && this.postProcessing.effects.length > 0) {
        this._renderWithPostProcessing();
      } else {
        // Renderizado normal
        this.renderer.render(this.scene, this.camera);
      }

      this.stats.drawCalls = this.renderer.info.render.calls;
      this.stats.triangles = this.renderer.info.render.triangles;
      this.stats.geometries = this.renderer.info.memory.geometries;
      this.stats.textures = this.renderer.info.memory.textures;

      this.needsRender = false;
    } catch (error) {
      console.error('Error rendering scene:', error);
    }
  }

  /**
   * Renderiza con post-processing
   */
  _renderWithPostProcessing() {
    if (!this.postProcessing.effects || this.postProcessing.effects.length === 0) {
      // Sin efectos, renderizar normal
      this.renderer.render(this.scene, this.camera);
      return;
    }

    try {
      // Crear EffectComposer si no existe
      if (!this.effectComposer) {
        const { EffectComposer } = require('postprocessing');
        const { RenderPass } = require('postprocessing');
        const { ShaderPass } = require('postprocessing');

        this.effectComposer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.effectComposer.addPass(this.renderPass);

        console.log('✅ Post-processing EffectComposer created');
      }

      // Actualizar render pass si la cámara cambió
      if (this.renderPass && this.renderPass.camera !== this.camera) {
        this.renderPass.camera = this.camera;
      }

      // Aplicar efectos
      this._applyPostProcessingEffects();

      // Renderizar con efectos
      this.effectComposer.render();

      this.stats.drawCalls = this.renderer.info.render.calls;
      this.stats.triangles = this.renderer.info.render.triangles;
      this.stats.geometries = this.renderer.info.memory.geometries;
      this.stats.textures = this.renderer.info.memory.textures;

    } catch (error) {
      console.warn('Post-processing not available, falling back to normal render:', error.message);
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Aplica efectos de post-processing
   */
  _applyPostProcessingEffects() {
    if (!this.effectComposer) return;

    // Remover efectos existentes excepto RenderPass
    const passes = this.effectComposer.passes;
    for (let i = passes.length - 1; i > 0; i--) {
      this.effectComposer.removePass(passes[i]);
    }

    // Aplicar efectos configurados
    this.postProcessing.effects.forEach(effectConfig => {
      try {
        const pass = this._createEffectPass(effectConfig);
        if (pass) {
          this.effectComposer.addPass(pass);
        }
      } catch (error) {
        console.warn(`Failed to create effect ${effectConfig.type}:`, error);
      }
    });
  }

  /**
   * Crea un pass de efecto específico
   */
  _createEffectPass(effectConfig) {
    const { type, enabled = true, intensity = 1, ...options } = effectConfig;

    if (!enabled) return null;

    try {
      const { EffectPass, KernelSize } = require('postprocessing');
      const { BlendFunction } = require('postprocessing');

      switch (type) {
        case 'bloom':
          const { Bloom } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new Bloom({
              intensity: intensity,
              luminanceThreshold: options.luminanceThreshold || 0.85,
              luminanceSmoothing: options.luminanceSmoothing || 0.2,
              kernelSize: options.kernelSize || KernelSize.LARGE,
              blendFunction: options.blendFunction || BlendFunction.SCREEN
            })
          );

        case 'smaa':
          const { SMAAEffect } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new SMAAEffect()
          );

        case 'ssao':
          const { SSAOEffect } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new SSAOEffect({
              samples: options.samples || 16,
              rings: options.rings || 7,
              radius: options.radius || 0.1,
              intensity: options.intensity || 1.0,
              luminanceInfluence: options.luminanceInfluence || 0.4
            })
          );

        case 'vignette':
          const { Vignette } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new Vignette({
              offset: options.offset || 1.0,
              darkness: options.darkness || 1.0,
              blendFunction: options.blendFunction || BlendFunction.MULTIPLY
            })
          );

        case 'chromatic':
          const { ChromaticAberrationEffect } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new ChromaticAberrationEffect({
              offset: options.offset || new THREE.Vector2(0.0005, 0.001)
            })
          );

        case 'noise':
          const { NoiseEffect } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new NoiseEffect({
              premultiply: options.premultiply || true,
              blendFunction: options.blendFunction || BlendFunction.ADD
            })
          );

        case 'sepia':
          const { SepiaEffect } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new SepiaEffect({
              intensity: intensity || 1.0,
              blendFunction: options.blendFunction || BlendFunction.MULTIPLY
            })
          );

        case 'grayscale':
          const { GrayscaleEffect } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new GrayscaleEffect(intensity || 1.0)
          );

        case 'gamma':
          const { GammaCorrectionEffect } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new GammaCorrectionEffect(options.gamma || 2.2)
          );

        case 'tone_mapping':
          const { ToneMappingEffect } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new ToneMappingEffect({
              mode: options.mode || 1, // ACESFilmic
              exposure: options.exposure || 1.0,
              whitePoint: options.whitePoint || 4.0,
              middleGrey: options.middleGrey || 0.6,
              minLuminance: options.minLuminance || 0.01,
              maxLuminance: options.maxLuminance || 16.0,
              averageLuminance: options.averageLuminance || 1.0,
              adaptationRate: options.adaptationRate || 1.0
            })
          );

        case 'depth_of_field':
          const { DepthOfFieldEffect } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new DepthOfFieldEffect(this.camera, {
              focusDistance: options.focusDistance || 0.02,
              focalLength: options.focalLength || 0.050,
              bokehScale: options.bokehScale || 1.0,
              bokehRotation: options.bokehRotation || Math.PI / 2,
              width: options.width || window.innerWidth,
              height: options.height || window.innerHeight
            })
          );

        case 'motion_blur':
          const { MotionBlurEffect } = require('postprocessing');
          return new EffectPass(
            this.camera,
            new MotionBlurEffect({
              intensity: options.intensity || 1.0,
              samples: options.samples || 64,
              jitter: options.jitter || 0.1
            })
          );

        default:
          console.warn(`Unknown post-processing effect: ${type}`);
          return null;
      }
    } catch (error) {
      console.warn(`Failed to create ${type} effect:`, error.message);
      return null;
    }
  }

  /**
   * Actualiza controles de cámara
   */
  _updateCameraControls() {
    if (!this.camera) return;

    // Actualizar cámara si tiene método update
    if (this.camera.update) {
      this.camera.update();
    }

    // Actualizar matrices de cámara
    this.camera.updateMatrixWorld();
  }

  /**
   * Aplica optimizaciones
   */
  _applyOptimizations() {
    // Frustum culling
    if (this.culling.frustum && this.camera) {
      this._updateFrustumCulling();
    }

    // Adaptive quality
    if (this.performance.adaptiveQuality) {
      this._applyAdaptiveQuality();
    }
  }

  /**
   * Actualiza frustum culling
   */
  _updateFrustumCulling() {
    if (!this.scene) return;

    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4();

    matrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);

    this.scene.traverse(object => {
      if (object.isMesh && object.frustumCulled !== false) {
        if (!frustum.intersectsObject(object)) {
          object.visible = false;
        } else if (!object.visible) {
          // Solo marcar como visible si estaba oculto por culling
          object.visible = true;
        }
      }
    });
  }

  /**
   * Aplica calidad adaptativa
   */
  _applyAdaptiveQuality() {
    const targetFrameTime = 1000 / this.performance.targetFPS;
    const avgFrameTime = this._frameTimes.reduce((a, b) => a + b, 0) / this._frameTimes.length;

    if (avgFrameTime > targetFrameTime * 1.2) {
      // FPS bajo, reducir calidad
      this._reduceQuality();
    } else if (avgFrameTime < targetFrameTime * 0.8) {
      // FPS alto, aumentar calidad
      this._increaseQuality();
    }
  }

  /**
   * Reduce la calidad de renderizado
   */
  _reduceQuality() {
    const qualityLevels = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = qualityLevels.indexOf(this.performance.qualityLevel);

    if (currentIndex > 0) {
      this.performance.qualityLevel = qualityLevels[currentIndex - 1];
      console.log(`🎮 Render quality reduced to: ${this.performance.qualityLevel}`);
      this._applyQualitySettings();
    }
  }

  /**
   * Aumenta la calidad de renderizado
   */
  _increaseQuality() {
    const qualityLevels = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = qualityLevels.indexOf(this.performance.qualityLevel);

    if (currentIndex < qualityLevels.length - 1) {
      this.performance.qualityLevel = qualityLevels[currentIndex + 1];
      console.log(`🎮 Render quality increased to: ${this.performance.qualityLevel}`);
      this._applyQualitySettings();
    }
  }

  /**
   * Aplica configuraciones de calidad
   */
  _applyQualitySettings() {
    const settings = this._getQualitySettings(this.performance.qualityLevel);

    if (this.renderer) {
      this.renderer.shadowMap.enabled = settings.shadows;
      this.renderer.shadowMap.type = settings.shadowType;
      this.renderer.toneMappingExposure = settings.exposure;
    }

    // Aplicar a la escena
    if (this.scene) {
      this.scene.traverse(object => {
        if (object.isMesh && object.material) {
          if (object.material.isMeshStandardMaterial || object.material.isMeshPhysicalMaterial) {
            object.material.roughness = settings.roughness;
            object.material.metalness = settings.metalness;
          }
        }
      });
    }
  }

  /**
   * Obtiene configuraciones de calidad
   */
  _getQualitySettings(level) {
    const settings = {
      low: {
        shadows: true,
        shadowType: THREE.BasicShadowMap,
        exposure: 0.8,
        roughness: 1,
        metalness: 0
      },
      medium: {
        shadows: true,
        shadowType: THREE.PCFShadowMap,
        exposure: 1,
        roughness: 0.8,
        metalness: 0.1
      },
      high: {
        shadows: true,
        shadowType: THREE.PCFSoftShadowMap,
        exposure: 1,
        roughness: 0.5,
        metalness: 0.2
      },
      ultra: {
        shadows: true,
        shadowType: THREE.PCFSoftShadowMap,
        exposure: 1.1,
        roughness: 0.3,
        metalness: 0.3
      }
    };

    return settings[level] || settings.medium;
  }

  /**
   * Actualiza estadísticas
   */
  _updateStats(startTime, deltaTime) {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    this.stats.renderTime = renderTime;

    // Actualizar FPS
    this._frameTimes.push(renderTime);
    if (this._frameTimes.length > 60) {
      this._frameTimes.shift();
    }

    const avgFrameTime = this._frameTimes.reduce((a, b) => a + b, 0) / this._frameTimes.length;
    this.stats.fps = Math.round(1000 / avgFrameTime);

    this.stats.frames++;

    // Emitir evento de frame rendered
    this.emitter.emit('frameRendered', {
      stats: { ...this.stats },
      deltaTime,
      renderTime
    });
  }

  /**
   * Fuerza un re-render
   */
  render() {
    this.needsRender = true;
    if (!this.isRendering) {
      this._render();
    }
  }

  /**
   * Toma una captura de pantalla
   */
  captureScreenshot(width = 1920, height = 1080) {
    if (!this.renderer) return null;

    const originalSize = this.renderer.getSize(new THREE.Vector2());

    // Cambiar tamaño temporalmente
    this.renderer.setSize(width, height);

    // Renderizar
    this.renderer.render(this.scene, this.camera);

    // Obtener imagen
    const dataURL = this.renderer.domElement.toDataURL('image/png');

    // Restaurar tamaño original
    this.renderer.setSize(originalSize.x, originalSize.y);

    return dataURL;
  }

  /**
   * Redimensiona el renderizador
   */
  resize(width, height) {
    if (!this.renderer) return;

    this.renderer.setSize(width, height);

    if (this.camera && this.camera.isPerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    this.needsRender = true;
  }

  /**
   * Configura el post-processing
   */
  setPostProcessing(enabled, effects = []) {
    this.postProcessing.enabled = enabled;
    this.postProcessing.effects = effects;

    // Forzar re-render si se está renderizando
    if (enabled) {
      this.needsRender = true;
    }
  }

  /**
   * Añade un efecto de post-processing
   */
  addPostProcessingEffect(effectConfig) {
    if (!this.postProcessing.effects) {
      this.postProcessing.effects = [];
    }
    this.postProcessing.effects.push(effectConfig);
    this.postProcessing.enabled = true;
    this.needsRender = true;
  }

  /**
   * Remueve un efecto de post-processing
   */
  removePostProcessingEffect(effectType) {
    if (this.postProcessing.effects) {
      this.postProcessing.effects = this.postProcessing.effects.filter(
        e => e.type !== effectType
      );
    }
    this.needsRender = true;
  }

  /**
   * Limpia todos los efectos de post-processing
   */
  clearPostProcessingEffects() {
    this.postProcessing.effects = [];
    this.postProcessing.enabled = false;

    // Limpiar EffectComposer
    if (this.effectComposer) {
      const passes = this.effectComposer.passes;
      for (let i = passes.length - 1; i > 0; i--) {
        this.effectComposer.removePass(passes[i]);
      }
    }

    this.needsRender = true;
  }

  /**
   * Habilita efecto Bloom (brillo)
   */
  enableBloom(intensity = 1) {
    this.addPostProcessingEffect({
      type: 'bloom',
      enabled: true,
      intensity,
      luminanceThreshold: 0.85,
      luminanceSmoothing: 0.2
    });
  }

  /**
   * Habilita SSAO (ambient occlusion)
   */
  enableSSAO(intensity = 1) {
    this.addPostProcessingEffect({
      type: 'ssao',
      enabled: true,
      intensity,
      radius: 0.1,
      samples: 16
    });
  }

  /**
   * Habilita Motion Blur
   */
  enableMotionBlur(intensity = 1) {
    this.addPostProcessingEffect({
      type: 'motion_blur',
      enabled: true,
      intensity
    });
  }

  /**
   * Habilita Depth of Field
   */
  enableDepthOfField(focusDistance = 0.02) {
    this.addPostProcessingEffect({
      type: 'depth_of_field',
      enabled: true,
      focusDistance,
      focalLength: 0.050,
      bokehScale: 1.0
    });
  }

  /**
   * Configura el rendimiento
   */
  setPerformance(options) {
    Object.assign(this.performance, options);

    if (options.qualityLevel) {
      this._applyQualitySettings();
    }
  }

  /**
   * Configura culling
   */
  setCulling(options) {
    Object.assign(this.culling, options);
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    return {
      ...this.stats,
      qualityLevel: this.performance.qualityLevel,
      shadowsEnabled: this.config.shadowMap.enabled,
      postProcessingEnabled: this.postProcessing.enabled,
      sceneChildren: this.scene ? this.scene.children.length : 0
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
    // Liberar EffectComposer
    if (this.effectComposer) {
      this.effectComposer.dispose();
      this.effectComposer = null;
      this.renderPass = null;
    }

    // Liberar renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    // Liberar escena
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }

    this.camera = null;
    this.meshSystem = null;
    this.lightSystem = null;

    this._frameTimes = [];
    this.emitter.removeAllListeners();

    super.destroy();
  }
}

export default RenderSystem;