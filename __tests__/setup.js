/**
 * Jest Setup File
 * Configuración inicial para todos los tests
 */

// Mock de window.requestAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock de performance.now
global.performance = {
  now: () => Date.now()
};

// Mock de EventEmitter global para navegadores (si no existe)
if (typeof global.EventEmitter === 'undefined') {
  global.EventEmitter = class EventEmitter {
    constructor() {
      this.events = {};
    }

    on(event, listener) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
    }

    off(event, listener) {
      if (!this.events[event]) return;
      this.events[event] = this.events[event].filter(l => l !== listener);
    }

    emit(event, ...args) {
      if (!this.events[event]) return;
      this.events[event].forEach(listener => listener(...args));
    }

    removeAllListeners(event) {
      if (event) {
        delete this.events[event];
      } else {
        this.events = {};
      }
    }
  };
}

// Mock de Three.js para tests
const THREE = {
  Scene: class Scene {},
  PerspectiveCamera: class PerspectiveCamera {
    constructor() {
      this.projectionMatrix = { elements: [] };
      this.matrixWorldInverse = { elements: [] };
      this.aspect = 1;
      this.updateProjectionMatrix = jest.fn();
      this.updateMatrixWorld = jest.fn();
    }
  },
  WebGLRenderer: class WebGLRenderer {
    constructor() {
      this.info = {
        render: { calls: 0, triangles: 0 },
        memory: { geometries: 0, textures: 0 }
      };
      this.shadowMap = { enabled: false, type: 0 };
      this.toneMapping = 0;
      this.toneMappingExposure = 1;
      this.outputEncoding = 0;
      this.physicallyCorrectLights = false;
      this.setSize = jest.fn();
      this.render = jest.fn();
      this.dispose = jest.fn();
      this.getSize = jest.fn(() => ({ x: 1920, y: 1080 }));
      this.domElement = {
        toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
        style: {}
      };
    }
  },
  Mesh: class Mesh {
    constructor() {
      this.visible = true;
      this.frustumCulled = true;
      this.isMesh = true;
      this.material = {};
      this.traverse = jest.fn();
    }
  },
  AmbientLight: class AmbientLight {},
  DirectionalLight: class DirectionalLight {},
  BasicShadowMap: 0,
  PCFShadowMap: 1,
  PCFSoftShadowMap: 2,
  ACESFilmicToneMapping: 0,
  sRGBEncoding: 3001,
  Frustum: class Frustum {
    setFromProjectionMatrix() {}
    intersectsObject() { return true; }
  },
  Matrix4: class Matrix4 {
    constructor() {
      this.elements = [];
    }
    multiplyMatrices() {}
  },
  Vector2: class Vector2 {
    constructor() {
      this.x = 0;
      this.y = 0;
    }
  }
};

// Mock global de THREE
global.THREE = THREE;
global.window.THREE = THREE;

// Mock de React Three Fiber (virtual: el paquete es peer opcional y puede no estar instalado)
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => children,
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    gl: new THREE.WebGLRenderer()
  }))
}), { virtual: true });

// Mock de Expo modules (virtual: no instalados en este entorno)
jest.mock('expo-gl', () => ({}), { virtual: true });
jest.mock('expo-three', () => ({}), { virtual: true });

// Silenciar console.warn y console.error en tests (opcional)
// console.warn = jest.fn();
// console.error = jest.fn();