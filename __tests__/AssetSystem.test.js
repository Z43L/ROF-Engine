/**
 * Tests para AssetSystem
 * Verifica que el sistema de gestión de assets funciona correctamente
 */

import AssetSystem, { AssetType, AssetStatus, AssetLoader } from '../src/systems/AssetSystem.js';

describe('AssetSystem', () => {
  let assetSystem;
  let mockWorld;

  beforeEach(() => {
    // Crear mock del world
    mockWorld = {
      getSystem: jest.fn()
    };

    // Crear instancia del AssetSystem
    assetSystem = new AssetSystem();
    assetSystem.world = mockWorld;
  });

  afterEach(() => {
    assetSystem.destroy();
  });

  describe('Inicialización', () => {
    test('debería crear una instancia de AssetSystem', () => {
      expect(assetSystem).toBeInstanceOf(AssetSystem);
      expect(assetSystem.name).toBe('AssetSystem');
    });

    test('debería inicializar con configuración por defecto', () => {
      assetSystem.init(mockWorld);

      expect(assetSystem.assets).toBeInstanceOf(Map);
      expect(assetSystem.cache).toBeInstanceOf(Map);
      expect(assetSystem.loadQueue).toEqual([]);
      expect(assetSystem.loading).toBeInstanceOf(Set);
    });
  });

  describe('Registro de Assets', () => {
    test('debería registrar un nuevo asset', () => {
      const asset = assetSystem.registerAsset(
        'hero',
        AssetType.MODEL,
        '/models/hero.gltf',
        { metadata: { group: 'characters' } }
      );

      expect(asset).toBeDefined();
      expect(asset.id).toBe('hero');
      expect(asset.type).toBe(AssetType.MODEL);
      expect(asset.uri).toBe('/models/hero.gltf');
      expect(assetSystem.assets.has('hero')).toBe(true);
    });

    test('debería warn si se registra un asset duplicado', () => {
      console.warn = jest.fn();

      assetSystem.registerAsset('duplicate', AssetType.TEXTURE, '/texture.png');
      assetSystem.registerAsset('duplicate', AssetType.TEXTURE, '/texture2.png');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Asset 'duplicate' already registered")
      );
    });
  });

  describe('Carga de Assets', () => {
    test('debería cargar un asset registrado', async () => {
      // Mock del AssetLoader para texturas
      AssetLoader.loadTexture = jest.fn().mockResolvedValue({
        width: 1024,
        height: 1024
      });

      assetSystem.registerAsset('bg', AssetType.TEXTURE, '/bg.jpg');
      const loadedAsset = await assetSystem.loadAsset('bg');

      expect(loadedAsset).toBeDefined();
      expect(loadedAsset.status).toBe(AssetStatus.LOADED);
      expect(AssetLoader.loadTexture).toHaveBeenCalledWith('/bg.jpg', {});
    });

    test('debería lanzar error si intenta cargar un asset no registrado', async () => {
      await expect(assetSystem.loadAsset('nonexistent'))
        .rejects
        .toThrow("Asset 'nonexistent' not registered");
    });

    test('debería incrementar refCount si el asset ya está cargado', async () => {
      AssetLoader.loadTexture = jest.fn().mockResolvedValue({ data: 'texture' });

      assetSystem.registerAsset('texture', AssetType.TEXTURE, '/tex.png');
      await assetSystem.loadAsset('texture');

      // Intentar cargar de nuevo
      const result = await assetSystem.loadAsset('texture');

      expect(result.refCount).toBe(2); // Carga inicial + segunda carga
    });

    test('debería cargar múltiples assets', async () => {
      AssetLoader.loadTexture = jest.fn().mockResolvedValue({});
      AssetLoader.loadData = jest.fn().mockResolvedValue({ level: 1 });

      assetSystem.registerAsset('tex', AssetType.TEXTURE, '/img.png');
      assetSystem.registerAsset('data', AssetType.DATA, '/data.json');

      const results = await assetSystem.loadAssets(['tex', 'data']);

      expect(results).toBeInstanceOf(Map);
      expect(results.has('tex')).toBe(true);
      expect(results.has('data')).toBe(true);
    });

    test('debería precargar un grupo de assets', async () => {
      AssetLoader.loadTexture = jest.fn().mockResolvedValue({});

      assetSystem.registerAsset('asset1', AssetType.TEXTURE, '/1.png', { metadata: { group: 'level1' } });
      assetSystem.registerAsset('asset2', AssetType.TEXTURE, '/2.png', { metadata: { group: 'level1' } });
      assetSystem.registerAsset('asset3', AssetType.TEXTURE, '/3.png', { metadata: { group: 'level2' } });

      await assetSystem.preloadGroup('level1');

      expect(assetSystem.assets.get('asset1').status).toBe(AssetStatus.LOADED);
      expect(assetSystem.assets.get('asset2').status).toBe(AssetStatus.LOADED);
      expect(assetSystem.assets.get('asset3').status).toBe(AssetStatus.PENDING);
    });
  });

  describe('Descarga de Assets', () => {
    test('debería descargar un asset', async () => {
      AssetLoader.loadTexture = jest.fn().mockResolvedValue({});

      assetSystem.registerAsset('texture', AssetType.TEXTURE, '/tex.png');
      await assetSystem.loadAsset('texture');

      assetSystem.unloadAsset('texture');

      expect(assetSystem.assets.get('texture').status).toBe(AssetStatus.UNLOADED);
    });

    test('debería decrementar refCount correctamente', async () => {
      AssetLoader.loadTexture = jest.fn().mockResolvedValue({});

      assetSystem.registerAsset('shared', AssetType.TEXTURE, '/shared.png');
      await assetSystem.loadAsset('shared');
      await assetSystem.loadAsset('shared'); // Cargar dos veces

      assetSystem.unloadAsset('shared'); // Primera descarga
      expect(assetSystem.assets.get('shared').refCount).toBe(1);

      assetSystem.unloadAsset('shared'); // Segunda descarga
      expect(assetSystem.assets.get('shared').status).toBe(AssetStatus.UNLOADED);
    });
  });

  describe('Obtención de Assets', () => {
    test('debería obtener un asset cargado', async () => {
      const mockTexture = { width: 1024, height: 1024 };
      AssetLoader.loadTexture = jest.fn().mockResolvedValue(mockTexture);

      assetSystem.registerAsset('texture', AssetType.TEXTURE, '/tex.png');
      await assetSystem.loadAsset('texture');

      const retrieved = assetSystem.getAsset('texture');

      expect(retrieved).toBe(mockTexture);
    });

    test('debería retornar null si el asset no está cargado', () => {
      assetSystem.registerAsset('pending', AssetType.TEXTURE, '/pending.png');

      const retrieved = assetSystem.getAsset('pending');

      expect(retrieved).toBeNull();
    });

    test('debería verificar si un asset está cargado', async () => {
      AssetLoader.loadData = jest.fn().mockResolvedValue({});

      assetSystem.registerAsset('data', AssetType.DATA, '/data.json');

      expect(assetSystem.isLoaded('data')).toBe(false);

      await assetSystem.loadAsset('data');

      expect(assetSystem.isLoaded('data')).toBe(true);
    });
  });

  describe('Cache', () => {
    test('debería usar caché para assets duplicados', async () => {
      const mockData = { cached: true };
      AssetLoader.loadData = jest.fn().mockResolvedValue(mockData);

      // Registrar el mismo asset dos veces con la misma URI
      assetSystem.registerAsset('data1', AssetType.DATA, '/data.json');
      assetSystem.registerAsset('data2', AssetType.DATA, '/data.json');

      await assetSystem.loadAsset('data1');
      await assetSystem.loadAsset('data2');

      // AssetLoader.loadData debería haberse llamado solo una vez
      expect(AssetLoader.loadData).toHaveBeenCalledTimes(1);
    });

    test('debería limpiar el caché', async () => {
      assetSystem.cache.set('test', { data: 'cached' });

      assetSystem.clearCache();

      expect(assetSystem.cache.size).toBe(0);
    });
  });

  describe('Auto-descarga', () => {
    test('debería auto-descargar assets no usados', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      AssetLoader.loadTexture = jest.fn().mockResolvedValue({});

      assetSystem.registerAsset('old', AssetType.TEXTURE, '/old.png');
      await assetSystem.loadAsset('old');

      // Simular que pasaron más de 30 segundos
      jest.spyOn(Date, 'now').mockReturnValue(now + 35000);

      // Llamar a auto-unload manualmente (en un test real se llama en update)
      assetSystem._autoUnloadUnused();

      expect(assetSystem.assets.get('old').status).toBe(AssetStatus.UNLOADED);
    });
  });

  describe('Estadísticas', () => {
    test('debería obtener estadísticas', async () => {
      AssetLoader.loadTexture = jest.fn().mockResolvedValue({});
      AssetLoader.loadData = jest.fn().mockResolvedValue({});

      assetSystem.registerAsset('tex', AssetType.TEXTURE, '/img.png');
      await assetSystem.loadAsset('tex');

      const stats = assetSystem.getStats();

      expect(stats).toHaveProperty('totalLoaded');
      expect(stats).toHaveProperty('loadedCount');
      expect(stats).toHaveProperty('registered');
      expect(stats.registered).toBe(1);
      expect(stats.loadedCount).toBe(1);
    });
  });

  describe('Event Listeners', () => {
    test('debería emitir eventos de carga', (done) => {
      AssetLoader.loadTexture = jest.fn().mockResolvedValue({});

      assetSystem.on('assetLoaded', ({ id, type }) => {
        expect(id).toBe('texture');
        expect(type).toBe(AssetType.TEXTURE);
        done();
      });

      assetSystem.registerAsset('texture', AssetType.TEXTURE, '/tex.png');
      assetSystem.loadAsset('texture');
    });

    test('debería emitir eventos de error', (done) => {
      AssetLoader.loadTexture = jest.fn().mockRejectedValue(new Error('Network error'));

      assetSystem.on('assetLoadError', ({ id, error }) => {
        expect(id).toBe('texture');
        expect(error).toBeInstanceOf(Error);
        done();
      });

      assetSystem.registerAsset('texture', AssetType.TEXTURE, '/tex.png');
      assetSystem.loadAsset('texture');
    });
  });
});