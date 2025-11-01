/**
 * LightSystem
 * Sistema para gestionar las luces en la escena 3D
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';
import { LightComponent } from '../components/3d/Light.js';

/**
 * LightSystem - Gestión de luces 3D
 */
class LightSystem extends System {
  constructor() {
    super('LightSystem', ['light'], 25); // Prioridad media (después de Physics, antes de Render)

    this.emitter = new EventEmitter();

    // Gestión de luces
    this.lights = new Map(); // entity -> light data
    this.lightsByType = {
      ambient: [],
      directional: [],
      point: [],
      spot: [],
      hemisphere: []
    };

    // Optimización
    this.maxLights = {
      ambient: 10,
      directional: 10,
      point: 10,
      spot: 10,
      hemisphere: 10
    };

    // Estadísticas
    this.stats = {
      totalLights: 0,
      shadowsEnabled: 0,
      helpersEnabled: 0,
      byType: {
        ambient: 0,
        directional: 0,
        point: 0,
        spot: 0,
        hemisphere: 0
      }
    };

    // Escena para agregar luces
    this.scene = null;
  }

  /**
   * Inicializa el sistema
   */
  init(world) {
    super.init(world);
    console.log('✅ LightSystem initialized');
  }

  /**
   * Registra una entidad con luz
   */
  onEntityAdded(entity) {
    const lightComponent = entity.getComponent('light');

    if (!lightComponent) return;

    // Crear la luz
    const lightData = this._createLight(entity, lightComponent);
    if (!lightData) return;

    this.lights.set(entity, lightData);
    this.lightsByType[lightComponent.lightType].push(entity);

    // Actualizar estadísticas
    this.stats.totalLights++;
    this.stats.byType[lightComponent.lightType]++;

    if (lightComponent.castShadow) {
      this.stats.shadowsEnabled++;
    }

    if (lightComponent.helper) {
      this.stats.helpersEnabled++;
    }

    // Agregar a la escena
    if (this.scene) {
      this.scene.add(lightData.light);

      if (lightData.helperObject) {
        this.scene.add(lightData.helperObject);
      }
    }

    // Emitir evento
    this.emitter.emit('lightAdded', { entity, light: lightData });
  }

  /**
   * Elimina una entidad del sistema
   */
  onEntityRemoved(entity) {
    const lightData = this.lights.get(entity);
    if (!lightData) return;

    const lightComponent = lightData.component;

    // Remover de la escena
    if (this.scene) {
      this.scene.remove(lightData.light);

      if (lightData.helperObject) {
        this.scene.remove(lightData.helperObject);
      }
    }

    // Liberar recursos
    this._disposeLight(lightData);

    this.lights.delete(entity);
    this.lightsByType[lightComponent.lightType] = this.lightsByType[
      lightComponent.lightType
    ].filter(e => e !== entity);

    // Actualizar estadísticas
    this.stats.totalLights--;
    this.stats.byType[lightComponent.lightType]--;

    if (lightComponent.castShadow) {
      this.stats.shadowsEnabled--;
    }

    if (lightComponent.helper) {
      this.stats.helpersEnabled--;
    }

    // Emitir evento
    this.emitter.emit('lightRemoved', { entity, light: lightData });
  }

  /**
   * Actualiza el sistema
   */
  update(deltaTime) {
    // Actualizar helpers si están habilitados
    this._updateHelpers();
  }

  /**
   * Crea una luz a partir del componente
   */
  _createLight(entity, lightComponent) {
    try {
      const light = lightComponent.createLight();
      if (!light) {
        console.error('Failed to create light for entity:', entity);
        return null;
      }

      // Crear helper si está habilitado
      let helperObject = null;
      if (lightComponent.helper) {
        helperObject = lightComponent.createHelper();
      }

      const lightData = {
        light,
        component: lightComponent,
        helperObject
      };

      return lightData;
    } catch (error) {
      console.error('Error creating light:', error);
      return null;
    }
  }

  /**
   * Actualiza los helpers de las luces
   */
  _updateHelpers() {
    this.lights.forEach(lightData => {
      if (lightData.helperObject) {
        lightData.component.updateHelper();
      }
    });
  }

  /**
   * Libera una luz y sus recursos
   */
  _disposeLight(lightData) {
    if (!lightData) return;

    // Liberar helper
    if (lightData.helperObject) {
      lightData.helperObject.dispose?.();
      lightData.helperObject = null;
    }

    // Liberar luz
    if (lightData.light) {
      lightData.light.dispose?.();
      lightData.light = null;
    }

    // Liberar componente
    if (lightData.component) {
      lightData.component.dispose();
      lightData.component = null;
    }
  }

  /**
   * Establece la escena para agregar luces
   */
  setScene(scene) {
    this.scene = scene;

    // Agregar todas las luces existentes a la nueva escena
    if (scene) {
      this.lights.forEach(lightData => {
        scene.add(lightData.light);
        if (lightData.helperObject) {
          scene.add(lightData.helperObject);
        }
      });
    }
  }

  /**
   * Obtiene la luz de una entidad
   */
  getLight(entity) {
    const lightData = this.lights.get(entity);
    return lightData ? lightData.light : null;
  }

  /**
   * Actualiza las propiedades de una luz
   */
  updateLight(entity, properties) {
    const lightData = this.lights.get(entity);
    const lightComponent = entity.getComponent('light');

    if (!lightData || !lightComponent) return;

    // Actualizar componente
    lightComponent.updateProperties(properties);
  }

  /**
   * Actualiza la posición de una luz
   */
  updateLightPosition(entity, position) {
    const lightData = this.lights.get(entity);
    const lightComponent = entity.getComponent('light');

    if (!lightData || !lightComponent) return;

    lightComponent.updatePosition(position);
  }

  /**
   * Actualiza el objetivo de una luz
   */
  updateLightTarget(entity, target) {
    const lightData = this.lights.get(entity);
    const lightComponent = entity.getComponent('light');

    if (!lightData || !lightComponent) return;

    lightComponent.updateTarget(target);
  }

  /**
   * Obtiene todas las luces de un tipo
   */
  getLightsByType(type) {
    return this.lightsByType[type] || [];
  }

  /**
   * Obtiene todas las luces
   */
  getAllLights() {
    return Array.from(this.lights.values()).map(l => l.light);
  }

  /**
   * Activa/desactiva las sombras globalmente
   */
  setShadowsEnabled(enabled) {
    this.lights.forEach(lightData => {
      if (lightData.light && lightData.component) {
        lightData.component.updateProperties({ castShadow: enabled });
      }
    });
  }

  /**
   * Activa/desactiva los helpers globalmente
   */
  setHelpersEnabled(enabled) {
    this.lights.forEach((lightData, entity) => {
      if (!lightData.helperObject && enabled) {
        // Crear helper
        if (this.scene) {
          lightData.helperObject = lightData.component.createHelper();
          if (lightData.helperObject) {
            this.scene.add(lightData.helperObject);
            this.stats.helpersEnabled++;
          }
        }
      } else if (lightData.helperObject && !enabled) {
        // Remover helper
        if (this.scene) {
          this.scene.remove(lightData.helperObject);
          lightData.helperObject.dispose?.();
          lightData.helperObject = null;
          this.stats.helpersEnabled--;
        }
      }

      // Actualizar componente
      if (lightData.component) {
        lightData.component.helper = enabled;
      }
    });
  }

  /**
   * Configura la calidad de las sombras
   */
  setShadowQuality(quality) {
    const shadowMapSize = {
      low: 512,
      medium: 1024,
      high: 2048,
      ultra: 4096
    }[quality] || 1024;

    this.lights.forEach(lightData => {
      if (lightData.light && lightData.component && lightData.component.castShadow) {
        lightData.component.updateProperties({ shadowMapSize });
      }
    });
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats() {
    return {
      ...this.stats,
      sceneAttached: this.scene !== null
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
    // Liberar todas las luces
    this.lights.forEach(lightData => this._disposeLight(lightData));
    this.lights.clear();

    // Limpiar arrays por tipo
    Object.keys(this.lightsByType).forEach(type => {
      this.lightsByType[type] = [];
    });

    this.emitter.removeAllListeners();

    super.destroy();
  }
}

export default LightSystem;