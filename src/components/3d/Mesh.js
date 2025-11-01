/**
 * Mesh Component
 * Representa una malla 3D que puede ser renderizada
 */

import Component from '../../core/Component.js';
import * as THREE from 'three';

/**
 * Componente Mesh - Datos de una malla 3D
 */
export class MeshComponent extends Component {
  constructor(options = {}) {
    super('mesh');

    // Geometría
    this.geometry = options.geometry || null;
    this.geometryType = options.geometryType || 'box'; // box, sphere, plane, custom
    this.geometryParams = options.geometryParams || {};

    // Material
    this.material = options.material || null;
    this.materialType = options.materialType || 'basic'; // basic, standard, physical, custom
    this.materialParams = options.materialParams || {};

    // Rendering properties
    this.castShadow = options.castShadow !== false;
    this.receiveShadow = options.receiveShadow !== false;
    this.visible = options.visible !== false;
    this.frustumCulled = options.frustumCulled !== false;

    // Instanced rendering
    this.count = options.count || 1;
    this.instanceMatrix = options.instanceMatrix || null;

    // LOD (Level of Detail)
    this.lodLevels = options.lodLevels || null;
    this.currentLOD = 0;

    // Referencias Three.js
    this.mesh = null;
    this.geometryObject = null;
    this.materialObject = null;
  }

  /**
   * Crea una geometría basada en el tipo
   */
  createGeometry() {
    switch (this.geometryType) {
      case 'box':
        const { width = 1, height = 1, depth = 1 } = this.geometryParams;
        this.geometryObject = new THREE.BoxGeometry(width, height, depth);
        break;

      case 'sphere':
        const { radius = 0.5, widthSegments = 32, heightSegments = 16 } = this.geometryParams;
        this.geometryObject = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        break;

      case 'plane':
        const { width = 1, height = 1, widthSegments = 1, heightSegments = 1 } = this.geometryParams;
        this.geometryObject = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
        break;

      case 'cylinder':
        const {
          radiusTop = 0.5,
          radiusBottom = 0.5,
          height = 1,
          radialSegments = 32
        } = this.geometryParams;
        this.geometryObject = new THREE.CylinderGeometry(
          radiusTop,
          radiusBottom,
          height,
          radialSegments
        );
        break;

      case 'cone':
        const { radius = 0.5, height = 1, radialSegments = 32 } = this.geometryParams;
        this.geometryObject = new THREE.ConeGeometry(radius, height, radialSegments);
        break;

      case 'torus':
        const { radius = 1, tube = 0.4, radialSegments = 16, tubularSegments = 100 } = this.geometryParams;
        this.geometryObject = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
        break;

      case 'custom':
        if (this.geometry) {
          this.geometryObject = this.geometry;
        }
        break;

      default:
        this.geometryObject = new THREE.BoxGeometry(1, 1, 1);
    }

    return this.geometryObject;
  }

  /**
   * Crea un material basado en el tipo
   */
  createMaterial() {
    switch (this.materialType) {
      case 'basic':
        const { color = 0xffffff, wireframe = false } = this.materialParams;
        this.materialObject = new THREE.MeshBasicMaterial({ color, wireframe });
        break;

      case 'lambert':
        const {
          color = 0xffffff,
          emissive = 0x000000,
          emissiveIntensity = 1,
          wireframe = false
        } = this.materialParams;
        this.materialObject = new THREE.MeshLambertMaterial({
          color,
          emissive,
          emissiveIntensity,
          wireframe
        });
        break;

      case 'phong':
        const {
          color = 0xffffff,
          emissive = 0x000000,
          specular = 0x111111,
          shininess = 30,
          wireframe = false
        } = this.materialParams;
        this.materialObject = new THREE.MeshPhongMaterial({
          color,
          emissive,
          specular,
          shininess,
          wireframe
        });
        break;

      case 'standard':
        const {
          color = 0xffffff,
          metalness = 0,
          roughness = 1,
          emissive = 0x000000,
          emissiveIntensity = 1,
          wireframe = false
        } = this.materialParams;
        this.materialObject = new THREE.MeshStandardMaterial({
          color,
          metalness,
          roughness,
          emissive,
          emissiveIntensity,
          wireframe
        });
        break;

      case 'physical':
        const {
          color = 0xffffff,
          metalness = 0,
          roughness = 0.5,
          clearcoat = 0,
          clearcoatRoughness = 0,
          transmission = 0,
          thickness = 0,
          wireframe = false
        } = this.materialParams;
        this.materialObject = new THREE.MeshPhysicalMaterial({
          color,
          metalness,
          roughness,
          clearcoat,
          clearcoatRoughness,
          transmission,
          thickness,
          wireframe
        });
        break;

      case 'toon':
        const { color = 0xffffff, gradientMap = null, wireframe = false } = this.materialParams;
        this.materialObject = new THREE.MeshToonMaterial({
          color,
          gradientMap,
          wireframe
        });
        break;

      case 'matcap':
        const { matcap = null, wireframe = false } = this.materialParams;
        this.materialObject = new THREE.MeshMatcapMaterial({
          matcap,
          wireframe
        });
        break;

      case 'custom':
        if (this.material) {
          this.materialObject = this.material;
        }
        break;

      default:
        this.materialObject = new THREE.MeshStandardMaterial({ color: 0xffffff });
    }

    return this.materialObject;
  }

  /**
   * Crea el mesh Three.js
   */
  createMesh() {
    // Crear geometría si no existe
    if (!this.geometryObject) {
      this.createGeometry();
    }

    // Crear material si no existe
    if (!this.materialObject) {
      this.createMaterial();
    }

    // Crear el mesh
    if (this.count > 1) {
      // Instanced mesh
      this.mesh = new THREE.InstancedMesh(
        this.geometryObject,
        this.materialObject,
        this.count
      );
    } else {
      // Mesh normal
      this.mesh = new THREE.Mesh(this.geometryObject, this.materialObject);
    }

    // Configurar propiedades de renderizado
    this.mesh.castShadow = this.castShadow;
    this.mesh.receiveShadow = this.receiveShadow;
    this.mesh.visible = this.visible;
    this.mesh.frustumCulled = this.frustumCulled;

    return this.mesh;
  }

  /**
   * Actualiza la geometría
   */
  updateGeometry(geometryParams) {
    this.geometryParams = { ...this.geometryParams, ...geometryParams };
    this.disposeGeometry();
    this.createGeometry();

    if (this.mesh) {
      this.mesh.geometry = this.geometryObject;
    }
  }

  /**
   * Actualiza el material
   */
  updateMaterial(materialParams) {
    this.materialParams = { ...this.materialParams, ...materialParams };
    this.disposeMaterial();
    this.createMaterial();

    if (this.mesh) {
      this.mesh.material = this.materialObject;
    }
  }

  /**
   * Libera la geometría
   */
  disposeGeometry() {
    if (this.geometryObject) {
      this.geometryObject.dispose();
      this.geometryObject = null;
    }
  }

  /**
   * Libera el material
   */
  disposeMaterial() {
    if (this.materialObject) {
      this.materialObject.dispose();
      this.materialObject = null;
    }
  }

  /**
   * Libera todos los recursos
   */
  dispose() {
    this.disposeGeometry();
    this.disposeMaterial();

    if (this.mesh) {
      this.mesh = null;
    }
  }

  /**
   * Serializa el componente
   */
  toJSON() {
    return {
      type: this.type,
      geometryType: this.geometryType,
      geometryParams: this.geometryParams,
      materialType: this.materialType,
      materialParams: this.materialParams,
      castShadow: this.castShadow,
      receiveShadow: this.receiveShadow,
      visible: this.visible,
      frustumCulled: this.frustumCulled,
      count: this.count
    };
  }
}

export default MeshComponent;
