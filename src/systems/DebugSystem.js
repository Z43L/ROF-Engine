/**
 * DebugSystem
 * Sistema de debugging y profiling para el engine
 * Muestra información en tiempo real sobre rendimiento y estado del juego
 */

import System from '../core/System.js';
import EventEmitter from '../utils/EventEmitter.js';

/**
 * DebugSystem - Sistema de debugging y profiling
 */
class DebugSystem extends System {
  constructor() {
    super('DebugSystem', [], 0); // Prioridad mínima

    this.emitter = new EventEmitter();

    // Configuración
    this.enabled = false;
    this.visible = false;
    this.position = 'top-right'; // top-left, top-right, bottom-left, bottom-right
    this.theme = 'dark'; // dark, light

    // UI del debugger
    this.container = null;
    this.panels = new Map();

    // Estadísticas recolectadas
    this.stats = {
      // Engine
      fps: 0,
      frameTime: 0,
      deltaTime: 0,
      totalTime: 0,

      // Render
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      lights: 0,

      // Memory
      memoryUsage: 0,
      geometriesMemory: 0,
      texturesMemory: 0,

      // Entities
      totalEntities: 0,
      entitiesByComponent: new Map(),

      // Systems
      systems: new Map(),
      systemUpdateTime: new Map(),

      // Network (if applicable)
      latency: 0,
      packetsPerSecond: 0
    };

    // Historial para gráficos
    this.history = {
      fps: [],
      frameTime: [],
      memoryUsage: [],
      maxHistory: 60 // 60 frames
    };

    // Referencias a otros sistemas
    this.renderSystem = null;
    this.meshSystem = null;
    this.lightSystem = null;
    this.physicsSystem = null;

    // Performance tracking
    this.frameStartTime = 0;
    this.frameCounter = 0;
    this.lastFpsUpdate = 0;

    // Estadísticas de llamadas a funciones
    this.functionCalls = new Map();
  }

  /**
   * Inicializa el sistema
   */
  init(world) {
    super.init(world);

    // Encontrar sistemas relacionados
    this._findSystems();

    // Crear UI si está habilitado
    if (this.enabled) {
      this._createUI();
    }

    console.log('✅ DebugSystem initialized');
  }

  /**
   * Encuentra sistemas relacionados
   */
  _findSystems() {
    if (!this.world) return;

    this.renderSystem = this.world.getSystem('RenderSystem');
    this.meshSystem = this.world.getSystem('MeshSystem');
    this.lightSystem = this.world.getSystem('LightSystem');
    this.physicsSystem = this.world.getSystem('PhysicsSystem');
  }

  /**
   * Habilita/deshabilita el sistema de debug
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    if (enabled) {
      this._createUI();
    } else {
      this._removeUI();
    }
  }

  /**
   * Muestra/oculta la UI de debug
   */
  setVisible(visible) {
    this.visible = visible;

    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Actualiza el sistema
   */
  update(deltaTime) {
    if (!this.enabled) return;

    const startTime = performance.now();

    // Recolectar estadísticas
    this._collectStats();

    // Actualizar UI si está visible
    if (this.visible) {
      this._updateUI();
    }

    // Trackear tiempo de update
    const updateTime = performance.now() - startTime;
    this.stats.systemUpdateTime.set('DebugSystem', updateTime);
  }

  /**
   * Recolecta estadísticas de todos los sistemas
   */
  _collectStats() {
    // Recolectar estadísticas del engine
    if (this.world && this.world.engine) {
      const engine = this.world.engine;
      this.stats.deltaTime = engine.deltaTime || 0;
      this.stats.totalTime = engine.time || 0;
    }

    // Recolectar estadísticas del render system
    if (this.renderSystem) {
      const renderStats = this.renderSystem.getStats();
      this.stats.fps = renderStats.fps || 0;
      this.stats.frameTime = renderStats.renderTime || 0;
      this.stats.drawCalls = renderStats.drawCalls || 0;
      this.stats.triangles = renderStats.triangles || 0;
      this.stats.lights = renderStats.lights || 0;
    }

    // Recolectar estadísticas del mesh system
    if (this.meshSystem) {
      const meshStats = this.meshSystem.getStats();
      this.stats.geometries = meshStats.totalMeshes || 0;
      this.stats.geometriesMemory = meshStats.cachedGeometries || 0;
      this.stats.textures = meshStats.cachedMaterials || 0;
    }

    // Recolectar estadísticas del light system
    if (this.lightSystem) {
      const lightStats = this.lightSystem.getStats();
      this.stats.lights = lightStats.totalLights || 0;
    }

    // Recolectar estadísticas de memoria
    if (performance.memory) {
      this.stats.memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
    }

    // Recolectar estadísticas de entidades
    if (this.world) {
      this.stats.totalEntities = this.world.entities.size;
      this.world.entities.forEach(entity => {
        const components = Array.from(entity.components.keys());
        components.forEach(compType => {
          const count = this.stats.entitiesByComponent.get(compType) || 0;
          this.stats.entitiesByComponent.set(compType, count + 1);
        });
      });
    }

    // Actualizar historial
    this._updateHistory();

    // Actualizar estadísticas de sistemas
    if (this.world) {
      this.world.systems.forEach(system => {
        const updateTime = this.stats.systemUpdateTime.get(system.name) || 0;
        this.stats.systems.set(system.name, {
          updateTime,
          priority: system.priority
        });
      });
    }
  }

  /**
   * Actualiza el historial de estadísticas
   */
  _updateHistory() {
    this.history.fps.push(this.stats.fps);
    this.history.frameTime.push(this.stats.frameTime);
    this.history.memoryUsage.push(this.stats.memoryUsage);

    // Limitar historial
    Object.keys(this.history).forEach(key => {
      if (this.history[key].length > this.history.maxHistory) {
        this.history[key].shift();
      }
    });
  }

  /**
   * Crea la UI de debug
   */
  _createUI() {
    if (typeof document === 'undefined') return; // No ejecutar en servidor

    // Remover UI anterior si existe
    this._removeUI();

    // Crear contenedor principal
    this.container = document.createElement('div');
    this.container.id = 'rof-debugger';
    this.container.className = `rof-debugger rof-debugger--${this.position} rof-debugger--${this.theme}`;
    this.container.style.cssText = `
      position: fixed;
      ${this._getPositionCSS()}
      background: ${this.theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)'};
      color: ${this.theme === 'dark' ? '#fff' : '#000'};
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      z-index: 10000;
      min-width: 250px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      user-select: none;
      display: ${this.visible ? 'block' : 'none'};
    `;

    // Crear paneles
    this._createStatsPanel();
    this._createRenderPanel();
    this._createEntitiesPanel();
    this._createSystemsPanel();
    this._createMemoryPanel();

    // Agregar al DOM
    document.body.appendChild(this.container);

    // Configurar atajos de teclado
    this._setupKeyboardShortcuts();
  }

  /**
   * Obtiene CSS de posición
   */
  _getPositionCSS() {
    const positions = {
      'top-left': 'top: 10px; left: 10px;',
      'top-right': 'top: 10px; right: 10px;',
      'bottom-left': 'bottom: 10px; left: 10px;',
      'bottom-right': 'bottom: 10px; right: 10px;'
    };
    return positions[this.position] || positions['top-right'];
  }

  /**
   * Crea panel de estadísticas generales
   */
  _createStatsPanel() {
    const panel = this._createPanel('Performance', 'stats');
    panel.innerHTML = `
      <div class="rof-debug-section">
        <div>FPS: <span class="rof-debug-value" id="debug-fps">0</span></div>
        <div>Frame Time: <span class="rof-debug-value" id="debug-frame-time">0</span>ms</div>
        <div>Delta Time: <span class="rof-debug-value" id="debug-delta-time">0</span>ms</div>
        <div>Total Time: <span class="rof-debug-value" id="debug-total-time">0</span>s</div>
      </div>
    `;
    this.container.appendChild(panel);
  }

  /**
   * Crea panel de renderizado
   */
  _createRenderPanel() {
    const panel = this._createPanel('Render', 'render');
    panel.innerHTML = `
      <div class="rof-debug-section">
        <div>Draw Calls: <span class="rof-debug-value" id="debug-draw-calls">0</span></div>
        <div>Triangles: <span class="rof-debug-value" id="debug-triangles">0</span></div>
        <div>Geometries: <span class="rof-debug-value" id="debug-geometries">0</span></div>
        <div>Textures: <span class="rof-debug-value" id="debug-textures">0</span></div>
        <div>Lights: <span class="rof-debug-value" id="debug-lights">0</span></div>
      </div>
    `;
    this.container.appendChild(panel);
  }

  /**
   * Crea panel de entidades
   */
  _createEntitiesPanel() {
    const panel = this._createPanel('Entities', 'entities');
    panel.innerHTML = `
      <div class="rof-debug-section">
        <div>Total: <span class="rof-debug-value" id="debug-total-entities">0</span></div>
        <div id="debug-entities-by-component"></div>
      </div>
    `;
    this.container.appendChild(panel);
  }

  /**
   * Crea panel de sistemas
   */
  _createSystemsPanel() {
    const panel = this._createPanel('Systems', 'systems');
    panel.innerHTML = `
      <div class="rof-debug-section" id="debug-systems-list"></div>
    `;
    this.container.appendChild(panel);
  }

  /**
   * Crea panel de memoria
   */
  _createMemoryPanel() {
    const panel = this._createPanel('Memory', 'memory');
    panel.innerHTML = `
      <div class="rof-debug-section">
        <div>Usage: <span class="rof-debug-value" id="debug-memory-usage">0</span> MB</div>
        <div>Geometries Cache: <span class="rof-debug-value" id="debug-geometries-memory">0</span></div>
        <div>Materials Cache: <span class="rof-debug-value" id="debug-textures-memory">0</span></div>
      </div>
    `;
    this.container.appendChild(panel);
  }

  /**
   * Crea un panel
   */
  _createPanel(title, id) {
    const panel = document.createElement('div');
    panel.className = 'rof-debug-panel';
    panel.id = `debug-panel-${id}`;
    panel.style.cssText = `
      margin-bottom: 10px;
      padding: 8px;
      background: ${this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
      border-radius: 3px;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      font-weight: bold;
      margin-bottom: 5px;
      color: ${this.theme === 'dark' ? '#4CAF50' : '#2196F3'};
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>${title}</span>
      <span class="rof-debug-toggle">▼</span>
    `;
    header.onclick = () => {
      const content = panel.querySelector('.rof-debug-section');
      const toggle = header.querySelector('.rof-debug-toggle');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▼';
      } else {
        content.style.display = 'none';
        toggle.textContent = '▶';
      }
    };

    panel.appendChild(header);

    return panel;
  }

  /**
   * Actualiza la UI
   */
  _updateUI() {
    if (!this.container) return;

    // Actualizar estadísticas
    const updateText = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    };

    // Performance
    updateText('debug-fps', this.stats.fps.toFixed(0));
    updateText('debug-frame-time', this.stats.frameTime.toFixed(2));
    updateText('debug-delta-time', this.stats.deltaTime.toFixed(3));
    updateText('debug-total-time', this.stats.totalTime.toFixed(2));

    // Render
    updateText('debug-draw-calls', this.stats.drawCalls);
    updateText('debug-triangles', this.stats.triangles.toLocaleString());
    updateText('debug-geometries', this.stats.geometries);
    updateText('debug-textures', this.stats.textures);
    updateText('debug-lights', this.stats.lights);

    // Memory
    updateText('debug-memory-usage', this.stats.memoryUsage.toFixed(2));
    updateText('debug-geometries-memory', this.stats.geometriesMemory);
    updateText('debug-textures-memory', this.stats.texturesMemory);

    // Entities
    updateText('debug-total-entities', this.stats.totalEntities);

    // Entities by component
    const entitiesByComponent = document.getElementById('debug-entities-by-component');
    if (entitiesByComponent) {
      entitiesByComponent.innerHTML = '';
      this.stats.entitiesByComponent.forEach((count, component) => {
        const div = document.createElement('div');
        div.textContent = `${component}: ${count}`;
        entitiesByComponent.appendChild(div);
      });
    }

    // Systems
    const systemsList = document.getElementById('debug-systems-list');
    if (systemsList) {
      systemsList.innerHTML = '';
      this.stats.systems.forEach((data, name) => {
        const div = document.createElement('div');
        div.style.cssText = 'margin: 2px 0;';
        div.innerHTML = `
          <span style="display: inline-block; width: 100px;">${name}:</span>
          <span class="rof-debug-value">${data.updateTime.toFixed(3)}ms</span>
          <span style="color: #888; font-size: 10px;">(prio: ${data.priority})</span>
        `;
        systemsList.appendChild(div);
      });
    }
  }

  /**
   * Configura atajos de teclado
   */
  _setupKeyboardShortcuts() {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (e) => {
      // Ctrl+` para mostrar/ocultar
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        this.setVisible(!this.visible);
      }

      // Ctrl+D para habilitar/deshabilitar
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.setEnabled(!this.enabled);
        if (!this.enabled) {
          this._removeUI();
        }
      }
    });
  }

  /**
   * Remueve la UI
   */
  _removeUI() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.panels.clear();
  }

  /**
   * Muestra un log en el debug
   */
  log(message, type = 'info') {
    if (!this.enabled || !this.container) return;

    const logPanel = this._createPanel('Console', 'console');
    logPanel.innerHTML = `
      <div class="rof-debug-section" id="debug-console-log" style="max-height: 200px; overflow-y: auto;"></div>
    `;
    this.container.appendChild(logPanel);

    const logContainer = document.getElementById('debug-console-log');
    if (logContainer) {
      const div = document.createElement('div');
      div.style.cssText = `
        color: ${type === 'error' ? '#ff6b6b' : type === 'warn' ? '#f9ca24' : '#4CAF50'};
        margin: 2px 0;
        font-size: 11px;
      `;
      div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
      logContainer.appendChild(div);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    return { ...this.stats };
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
    this._removeUI();

    this.history = {
      fps: [],
      frameTime: [],
      memoryUsage: [],
      maxHistory: 60
    };

    this.functionCalls.clear();
    this.stats.entitiesByComponent.clear();
    this.stats.systems.clear();
    this.stats.systemUpdateTime.clear();

    this.emitter.removeAllListeners();

    super.destroy();
  }
}

export default DebugSystem;