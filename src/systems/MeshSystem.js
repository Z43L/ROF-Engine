/**
 * MeshSystem
 * Sistema para gestionar la creación, actualización y destrucción de mallas 3D
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';
import { MeshComponent } from '../components/3d/Mesh.js';

/**
 * MeshSystem - Gestión de mallas 3D
 */
class MeshSystem extends System {
  constructor() {
    super('MeshSystem', ['transform', 'mesh'], 60); // Prioridad alta (después de Physics)

    this.emitter = new EventEmitter();

    // Gestión de mallas
    this.meshes = new Map(); // entity -> mesh data
    this.geometryCache = new Map(); // cache de geometrías
    this.materialCache = new Map(); // cache de materiales

    // Instanced rendering
    this.instancedMeshes = new Map();

    // Estadísticas
    this.stats = {
      totalMeshes: 0,
      instancedMeshes: 0,
      drawCalls: 0,
      vertices: 0,
      triangles: 0,
      geometriesCreated: 0,
      materialsCreated: 0
    };

    // Configuración
    this.config = {
      enableInstancing: true,
      enableFrustumCulling: true,
      enableLOD: true,
      maxInstancesPerMesh: 1000
    };
  }

  /**
   * Inicializa el sistema
   */
  init(world) {
    super.init(world);
    console.log('✅ MeshSystem initialized');
  }

  /**
   * Registra una entidad con mesh
   */
  onEntityAdded(entity) {
    const transform = entity.getComponent('transform');
    const meshComponent = entity.getComponent('mesh');

    if (!transform || !meshComponent) return;

    // Crear el mesh
    const meshData = this._createMesh(entity, meshComponent, transform);
    if (!meshData) return;

    this.meshes.set(entity, meshData);

    // Actualizar estadísticas
    this.stats.totalMeshes++;

    if (meshComponent.count > 1) {
      this.stats.instancedMeshes++;
    }

    this.stats.vertices += meshData.vertices || 0;
    this.stats.triangles += meshData.triangles || 0;

    // Emitir evento
    this.emitter.emit('meshAdded', { entity, mesh: meshData });
  }

  /**
   * Elimina una entidad del sistema
   */
  onEntityRemoved(entity) {
    const meshData = this.meshes.get(entity);
    if (!meshData) return;

    // Liberar recursos
    this._disposeMesh(meshData);

    this.meshes.delete(entity);

    // Actualizar estadísticas
    this.stats.totalMeshes--;
    if (meshData.mesh.count > 1) {
      this.stats.instancedMeshes--;
    }

    this.stats.vertices -= meshData.vertices || 0;
    this.stats.triangles -= meshData.triangles || 0;

    // Emitir evento
    this.emitter.emit('meshRemoved', { entity, mesh: meshData });
  }

  /**
   * Actualiza el sistema
   */
  update(deltaTime) {
    // Actualizar LOD si está habilitado
    if (this.config.enableLOD) {
      this._updateLOD();
    }

    // Actualizar instanced meshes
    if (this.config.enableInstancing) {
      this._updateInstancedMeshes();
    }

    // Actualizar transformaciones
    this._updateTransforms();
  }

  /**
   * Crea un mesh a partir del componente
   */
  _createMesh(entity, meshComponent, transform) {
    try {
      // Crear geometría
      let geometry = this._getOrCreateGeometry(meshComponent);
      if (!geometry) {
        console.error('Failed to create geometry for mesh:', entity);
        return null;
      }

      // Crear material
      let material = this._getOrCreateMaterial(meshComponent);
      if (!material) {
        console.error('Failed to create material for mesh:', entity);
        return null;
      }

      // Crear el mesh (normal o instanced)
      let mesh;
      let instanceMatrix = null;

      if (meshComponent.count > 1) {
        // Instanced mesh
        mesh = new THREE.InstancedMesh(geometry, material, meshComponent.count);
        instanceMatrix = new THREE.Matrix4();
      } else {
        // Mesh normal
        mesh = new THREE.Mesh(geometry, material);
      }

      // Aplicar transformación inicial
      this._applyTransform(mesh, transform);

      // Configurar propiedades de renderizado
      mesh.castShadow = meshComponent.castShadow;
      mesh.receiveShadow = meshComponent.receiveShadow;
      mesh.visible = meshComponent.visible;
      mesh.frustumCulled = meshComponent.frustumCulled;

      // Calcular estadísticas de vértices y triángulos
      const geometryParams = meshComponent.geometryParams || {};
      const vertices = this._estimateVertices(geometryParams);
      const triangles = this._estimateTriangles(geometryParams);

      const meshData = {
        mesh,
        geometry,
        material,
        component: meshComponent,
        instanceMatrix,
        vertices,
        triangles,
        geometryKey: this._getGeometryKey(meshComponent),
        materialKey: this._getMaterialKey(meshComponent),
        lodLevel: 0
      };

      // Configurar la instancia si es instanced
      if (meshComponent.count > 1) {
        this._setupInstancedMesh(meshData, entity);
      }

      return meshData;
    } catch (error) {
      console.error('Error creating mesh:', error);
      return null;
    }
  }

  /**
   * Obtiene o crea una geometría (con cache)
   */
  _getOrCreateGeometry(meshComponent) {
    const key = this._getGeometryKey(meshComponent);

    if (this.geometryCache.has(key)) {
      return this.geometryCache.get(key);
    }

    const geometry = meshComponent.createGeometry();

    if (geometry) {
      this.geometryCache.set(key, geometry);
      this.stats.geometriesCreated++;
    }

    return geometry;
  }

  /**
   * Obtiene o crea un material (con cache)
   */
  _getOrCreateMaterial(meshComponent) {
    const key = this._getMaterialKey(meshComponent);

    if (this.materialCache.has(key)) {
      return this.materialCache.get(key);
    }

    const material = meshComponent.createMaterial();

    if (material) {
      this.materialCache.set(key, material);
      this.stats.materialsCreated++;
    }

    return material;
  }

  /**
   * Genera una clave única para la geometría
   */
  _getGeometryKey(meshComponent) {
    const params = meshComponent.geometryParams || {};
    return `${meshComponent.geometryType}:${JSON.stringify(params)}`;
  }

  /**
   * Genera una clave única para el material
   */
  _getMaterialKey(meshComponent) {
    const params = meshComponent.materialParams || {};
    return `${meshComponent.materialType}:${JSON.stringify(params)}`;
  }

  /**
   * Aplica una transformación al mesh
   */
  _applyTransform(mesh, transform) {
    mesh.position.set(transform.x, transform.y, transform.z);

    if (transform.rotationX !== undefined) {
      mesh.rotation.set(
        transform.rotationX,
        transform.rotationY || 0,
        transform.rotationZ || 0
      );
    }

    if (transform.scaleX !== undefined) {
      mesh.scale.set(
        transform.scaleX,
        transform.scaleY || 1,
        transform.scaleZ || 1
      );
    }
  }

  /**
   * Actualiza las transformaciones de todos los meshes
   */
  _updateTransforms() {
    this.meshes.forEach((meshData, entity) => {
      const transform = entity.getComponent('transform');
      if (transform && meshData.mesh) {
        this._applyTransform(meshData.mesh, transform);
      }
    });
  }

  /**
   * Configura un instanced mesh
   */
  _setupInstancedMesh(meshData, entity) {
    const mesh = meshData.mesh;
    const transform = entity.getComponent('transform');

    if (!transform || !meshData.instanceMatrix) return;

    // Configurar matriz de instancia
    meshData.instanceMatrix.compose(
      new THREE.Vector3(transform.x, transform.y, transform.z),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          transform.rotationX || 0,
          transform.rotationY || 0,
          transform.rotationZ || 0
        )
      ),
      new THREE.Vector3(
        transform.scaleX || 1,
        transform.scaleY || 1,
        transform.scaleZ || 1
      )
    );

    mesh.setMatrixAt(0, meshData.instanceMatrix);
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Actualiza los instanced meshes
   */
  _updateInstancedMeshes() {
    // TODO: Implementar lógica para actualizar múltiples instancias
    // Esto requeriría un sistema de gestión de instancias
  }

  /**
   * Actualiza el LOD (Level of Detail)
   */
  _updateLOD() {
    // TODO: Implementar sistema de LOD
    // Requeriría cálculo de distancia a la cámara
  }

  /**
   * Estima el número de vértices según los parámetros
   */
  _estimateVertices(params) {
    const { widthSegments = 1, heightSegments = 1 } = params;

    switch (params.geometryType) {
      case 'box':
        return 24; // 4 vértices por cara * 6 caras
      case 'sphere':
        return (widthSegments + 1) * (heightSegments + 1);
      case 'plane':
        return (widthSegments + 1) * (heightSegments + 1);
      default:
        return 0;
    }
  }

  /**
   * Estima el número de triángulos según los parámetros
   */
  _estimateTriangles(params) {
    const { widthSegments = 1, heightSegments = 1 } = params;

    switch (params.geometryType) {
      case 'box':
        return 12; // 2 triángulos por cara * 6 caras
      case 'sphere':
        return widthSegments * heightSegments * 2;
      case 'plane':
        return widthSegments * heightSegments * 2;
      default:
        return 0;
    }
  }

  /**
   * Libera un mesh y sus recursos
   */
  _disposeMesh(meshData) {
    if (!meshData) return;

    // No dispose geometries y materials del cache compartido
    // Solo el mesh
    if (meshData.mesh) {
      meshData.mesh.dispose?.();
    }

    if (meshData.instanceMatrix) {
      meshData.instanceMatrix = null;
    }
  }

  /**
   * Obtiene el mesh de una entidad
   */
  getMesh(entity) {
    const meshData = this.meshes.get(entity);
    return meshData ? meshData.mesh : null;
  }

  /**
   * Actualiza la geometría de un mesh
   */
  updateGeometry(entity, geometryParams) {
    const meshData = this.meshes.get(entity);
    const meshComponent = entity.getComponent('mesh');

    if (!meshData || !meshComponent) return;

    // Actualizar geometría cacheada
    const key = this._getGeometryKey(meshComponent);
    this.geometryCache.delete(key);

    // Recrear geometría
    const geometry = this._getOrCreateGeometry(meshComponent);

    if (geometry) {
      meshData.geometry = geometry;
      if (meshData.mesh) {
        meshData.mesh.geometry = geometry;
      }
    }
  }

  /**
   * Actualiza el material de un mesh
   */
  updateMaterial(entity, materialParams) {
    const meshData = this.meshes.get(entity);
    const meshComponent = entity.getComponent('mesh');

    if (!meshData || !meshComponent) return;

    // Actualizar material cacheado
    const key = this._getMaterialKey(meshComponent);
    this.materialCache.delete(key);

    // Recrear material
    const material = this._getOrCreateMaterial(meshComponent);

    if (material) {
      meshData.material = material;
      if (meshData.mesh) {
        meshData.mesh.material = material;
      }
    }
  }

  /**
   * Obtiene todas las mallas
   */
  getAllMeshes() {
    return Array.from(this.meshes.values()).map(m => m.mesh);
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats() {
    return {
      ...this.stats,
      cachedGeometries: this.geometryCache.size,
      cachedMaterials: this.materialCache.size
    };
  }

  /**
   * Limpia el cache de geometrías
   */
  clearGeometryCache() {
    this.geometryCache.forEach(geometry => geometry.dispose());
    this.geometryCache.clear();
  }

  /**
   * Limpia el cache de materiales
   */
  clearMaterialCache() {
    this.materialCache.forEach(material => material.dispose());
    this.materialCache.clear();
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
    // Liberar todas las mallas
    this.meshes.forEach(meshData => this._disposeMesh(meshData));
    this.meshes.clear();

    // Limpiar caches
    this.clearGeometryCache();
    this.clearMaterialCache();

    // Limpiar instanced meshes
    this.instancedMeshes.clear();

    this.emitter.removeAllListeners();

    super.destroy();
  }
}

export default MeshSystem;