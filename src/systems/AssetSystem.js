/**
 * AssetSystem
 * Sistema de gestión de assets multiplataforma
 * Maneja carga, caché y descarga de recursos (modelos, texturas, sonidos, etc.)
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';

/**
 * AssetType - Tipos de assets soportados
 */
const AssetType = {
  TEXTURE: 'texture',
  MODEL: 'model',
  AUDIO: 'audio',
  FONT: 'font',
  DATA: 'data',
  VIDEO: 'video'
};

/**
 * AssetStatus - Estados de carga de un asset
 */
const AssetStatus = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  UNLOADED: 'unloaded'
};

/**
 * Asset - Representa un asset en el sistema
 */
class Asset {
  constructor(id, type, uri, options = {}) {
    this.id = id;
    this.type = type;
    this.uri = uri;
    this.data = null;
    this.status = AssetStatus.PENDING;
    this.error = null;
    this.loadedAt = null;
    this.size = 0;
    this.refCount = 0;
    this.metadata = options.metadata || {};
    this.priority = options.priority || 0;
  }
}

/**
 * AssetLoader - Cargadores específicos por tipo de asset
 */
class AssetLoader {
  /**
   * Carga una textura
   */
  static async loadTexture(uri, options = {}) {
    // Implementación depende de la plataforma
    const loader = new window.THREE.TextureLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        uri,
        (texture) => resolve(texture),
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Carga un modelo 3D (GLTF)
   */
  static async loadModel(uri, options = {}) {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        uri,
        (gltf) => resolve(gltf),
        (progress) => {
          if (options.onProgress) {
            options.onProgress(progress.loaded / progress.total);
          }
        },
        (error) => reject(error)
      );
    });
  }

  /**
   * Carga datos JSON
   */
  static async loadData(uri, options = {}) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Carga un archivo de texto
   */
  static async loadText(uri, options = {}) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to load text: ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Carga datos binarios
   */
  static async loadBinary(uri, options = {}) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to load binary: ${response.statusText}`);
    }
    return await response.arrayBuffer();
  }
}

/**
 * AssetSystem
 */
class AssetSystem extends System {
  constructor() {
    super('AssetSystem', [], 10); // Prioridad baja, carga asíncrona

    this.emitter = new EventEmitter();
    this.assets = new Map(); // id -> Asset
    this.loadQueue = [];
    this.loading = new Set();
    this.cache = new Map(); // uri -> data (caché compartido)

    this.config = {
      maxConcurrentLoads: 3,
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      preloadDistance: 100, // Distancia para precargar assets
      autoUnload: true,
      autoUnloadDelay: 30000 // 30 segundos
    };

    this.stats = {
      totalLoaded: 0,
      totalSize: 0,
      cacheSize: 0,
      loadedCount: 0,
      errorCount: 0
    };
  }

  init(world) {
    super.init(world);
  }

  // ===== Asset Management =====

  /**
   * Registra un asset para carga
   * @param {string} id - Identificador único
   * @param {AssetType} type - Tipo de asset
   * @param {string} uri - URI del asset
   * @param {Object} options - Opciones de carga
   */
  registerAsset(id, type, uri, options = {}) {
    if (this.assets.has(id)) {
      console.warn(`Asset '${id}' already registered`);
      return this.assets.get(id);
    }

    const asset = new Asset(id, type, uri, options);
    this.assets.set(id, asset);

    this.emitter.emit('assetRegistered', { id, type, uri });

    return asset;
  }

  /**
   * Carga un asset
   * @returns {Promise<Asset>}
   */
  async loadAsset(id, options = {}) {
    const asset = this.assets.get(id);

    if (!asset) {
      throw new Error(`Asset '${id}' not registered`);
    }

    // Si ya está cargado, incrementar refCount y retornar
    if (asset.status === AssetStatus.LOADED) {
      asset.refCount++;
      return asset;
    }

    // Si ya está en proceso de carga, esperar
    if (asset.status === AssetStatus.LOADING) {
      return this._waitForAsset(id);
    }

    // Iniciar carga
    asset.status = AssetStatus.LOADING;
    this.loading.add(id);

    this.emitter.emit('assetLoadStart', { id, type: asset.type, uri: asset.uri });

    try {
      // Verificar caché
      if (this.cache.has(asset.uri)) {
        asset.data = this.cache.get(asset.uri);
      } else {
        // Cargar según tipo
        asset.data = await this._loadAssetByType(asset, options);

        // Agregar a caché
        this.cache.set(asset.uri, asset.data);
      }

      asset.status = AssetStatus.LOADED;
      asset.loadedAt = Date.now();
      asset.refCount = 1;

      this.stats.totalLoaded++;
      this.stats.loadedCount++;

      this.loading.delete(id);

      this.emitter.emit('assetLoaded', {
        id,
        type: asset.type,
        size: asset.size
      });

      return asset;
    } catch (error) {
      asset.status = AssetStatus.ERROR;
      asset.error = error;

      this.stats.errorCount++;
      this.loading.delete(id);

      this.emitter.emit('assetLoadError', {
        id,
        type: asset.type,
        error
      });

      throw error;
    }
  }

  /**
   * Carga un asset según su tipo
   */
  async _loadAssetByType(asset, options) {
    const progressCallback = (progress) => {
      this.emitter.emit('assetLoadProgress', {
        id: asset.id,
        progress
      });
    };

    switch (asset.type) {
      case AssetType.TEXTURE:
        return await AssetLoader.loadTexture(asset.uri, {
          ...options,
          onProgress: progressCallback
        });

      case AssetType.MODEL:
        return await AssetLoader.loadModel(asset.uri, {
          ...options,
          onProgress: progressCallback
        });

      case AssetType.AUDIO:
        // El AudioSystem maneja esto
        return { uri: asset.uri };

      case AssetType.DATA:
        return await AssetLoader.loadData(asset.uri, options);

      case AssetType.FONT:
        return await AssetLoader.loadText(asset.uri, options);

      default:
        throw new Error(`Unknown asset type: ${asset.type}`);
    }
  }

  /**
   * Espera a que un asset termine de cargar
   */
  _waitForAsset(id) {
    return new Promise((resolve, reject) => {
      const checkAsset = () => {
        const asset = this.assets.get(id);

        if (asset.status === AssetStatus.LOADED) {
          asset.refCount++;
          resolve(asset);
        } else if (asset.status === AssetStatus.ERROR) {
          reject(asset.error);
        } else {
          setTimeout(checkAsset, 100);
        }
      };

      checkAsset();
    });
  }

  /**
   * Descarga un asset
   */
  unloadAsset(id, force = false) {
    const asset = this.assets.get(id);
    if (!asset || asset.status !== AssetStatus.LOADED) return;

    asset.refCount--;

    // Solo descargar si no hay referencias (o force)
    if (asset.refCount <= 0 || force) {
      asset.data = null;
      asset.status = AssetStatus.UNLOADED;
      asset.refCount = 0;

      this.stats.loadedCount--;

      this.emitter.emit('assetUnloaded', { id });
    }
  }

  /**
   * Obtiene un asset cargado
   */
  getAsset(id) {
    const asset = this.assets.get(id);

    if (!asset) {
      console.warn(`Asset '${id}' not found`);
      return null;
    }

    if (asset.status !== AssetStatus.LOADED) {
      console.warn(`Asset '${id}' not loaded (status: ${asset.status})`);
      return null;
    }

    return asset.data;
  }

  /**
   * Verifica si un asset está cargado
   */
  isLoaded(id) {
    const asset = this.assets.get(id);
    return asset && asset.status === AssetStatus.LOADED;
  }

  // ===== Batch Loading =====

  /**
   * Carga múltiples assets
   * @param {string[]} ids - Array de IDs de assets
   * @returns {Promise<Map<string, Asset>>}
   */
  async loadAssets(ids, options = {}) {
    const promises = ids.map(id => this.loadAsset(id, options));

    try {
      const results = await Promise.all(promises);
      const map = new Map();

      results.forEach((asset, index) => {
        map.set(ids[index], asset);
      });

      return map;
    } catch (error) {
      console.error('Failed to load some assets:', error);
      throw error;
    }
  }

  /**
   * Precarga assets por grupo/tag
   */
  async preloadGroup(groupName) {
    const assetsToLoad = Array.from(this.assets.values())
      .filter(asset => asset.metadata.group === groupName)
      .map(asset => asset.id);

    return await this.loadAssets(assetsToLoad);
  }

  // ===== Auto Management =====

  /**
   * Descarga assets no utilizados automáticamente
   */
  _autoUnloadUnused() {
    if (!this.config.autoUnload) return;

    const now = Date.now();
    const delay = this.config.autoUnloadDelay;

    this.assets.forEach((asset, id) => {
      if (
        asset.status === AssetStatus.LOADED &&
        asset.refCount === 0 &&
        now - asset.loadedAt > delay
      ) {
        this.unloadAsset(id, true);
      }
    });
  }

  // ===== System Update =====

  update(deltaTime) {
    super.update(deltaTime);

    // Auto-descargar assets no usados (cada 5 segundos)
    if (Math.random() < deltaTime / 5) {
      this._autoUnloadUnused();
    }

    // TODO: Implementar precarga basada en distancia
    // this._preloadNearbyAssets();
  }

  // ===== Events =====

  on(event, callback) {
    return this.emitter.on(event, callback);
  }

  off(event, callback) {
    this.emitter.off(event, callback);
  }

  // ===== Stats & Debug =====

  getStats() {
    return {
      ...this.stats,
      registered: this.assets.size,
      loading: this.loading.size,
      cached: this.cache.size
    };
  }

  /**
   * Limpia todo el caché
   */
  clearCache() {
    this.cache.clear();
    this.stats.cacheSize = 0;
    this.emitter.emit('cacheCleared');
  }

  destroy() {
    super.destroy();

    // Descargar todos los assets
    this.assets.forEach((asset, id) => {
      if (asset.status === AssetStatus.LOADED) {
        this.unloadAsset(id, true);
      }
    });

    this.clearCache();
    this.emitter.removeAllListeners();
  }
}

export default AssetSystem;
export { AssetType, AssetStatus, Asset, AssetLoader };
