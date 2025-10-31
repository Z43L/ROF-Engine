# Consideraciones de Performance - Sistema de Cinemáticas

## Principios Fundamentales

### 1. 60 FPS es el Objetivo
- En móviles, mantener 60 FPS es crítico para una experiencia fluida
- Cada frame tiene ~16.67ms para renderizar
- Cualquier operación que tome más causa "jank" (tartamudeo)

### 2. UI Thread vs JS Thread
- React Native tiene dos threads principales
- El JS thread maneja lógica de negocio
- El UI thread maneja renderizado
- **Objetivo**: Mover animaciones al UI thread

## Optimizaciones Implementadas

### 1. Worklets con React Native Reanimated

**Problema**: Animaciones en JS thread son lentas
**Solución**: Usar worklets que corren en UI thread

```javascript
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

function OptimizedAnimation() {
  const opacity = useSharedValue(0);

  // Esto corre en UI thread
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, { duration: 1000 })
    };
  });

  return <Animated.View style={animatedStyle} />;
}
```

**Beneficio**: 60 FPS garantizado, sin puente JS

### 2. Object Pooling

**Problema**: Crear/destruir objetos causa garbage collection
**Solución**: Reutilizar objetos

```javascript
class ParticlePool {
  constructor(size = 100) {
    this.pool = [];
    this.active = [];

    // Pre-crear objetos
    for (let i = 0; i < size; i++) {
      this.pool.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      life: 0,
      active: false
    };
  }

  acquire() {
    const particle = this.pool.pop() || this.createParticle();
    this.active.push(particle);
    particle.active = true;
    return particle;
  }

  release(particle) {
    particle.active = false;
    const index = this.active.indexOf(particle);
    if (index !== -1) {
      this.active.splice(index, 1);
      this.pool.push(particle);
    }
  }

  update(deltaTime) {
    // Solo actualizar partículas activas
    for (let i = this.active.length - 1; i >= 0; i--) {
      const particle = this.active[i];
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        this.release(particle);
      } else {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.z += particle.vz * deltaTime;
      }
    }
  }
}
```

**Beneficio**: Menos GC pauses, memoria estable

### 3. Memoization Agresiva

**Problema**: Re-renders innecesarios
**Solución**: React.memo, useMemo, useCallback

```javascript
import React, { useMemo, useCallback, memo } from 'react';

const ExpensiveComponent = memo(({ data, onUpdate }) => {
  // Solo re-renderiza si data o onUpdate cambian
  const processedData = useMemo(() => {
    return data.map(item => heavyComputation(item));
  }, [data]);

  return <View>{/* ... */}</View>;
});

function Parent() {
  const [state, setState] = useState(0);

  // Callback estable
  const handleUpdate = useCallback((value) => {
    setState(value);
  }, []); // Sin dependencias = nunca cambia

  return <ExpensiveComponent data={data} onUpdate={handleUpdate} />;
}
```

**Beneficio**: Menos trabajo de renderizado

### 4. Lazy Loading de Assets

**Problema**: Cargar todo al inicio es lento
**Solución**: Cargar bajo demanda

```javascript
class AssetManager {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
  }

  async load(key, loader) {
    // Si ya está en cache, retornar
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Si ya se está cargando, esperar
    if (this.loading.has(key)) {
      return this.loading.get(key);
    }

    // Cargar el asset
    const promise = loader().then(asset => {
      this.cache.set(key, asset);
      this.loading.delete(key);
      return asset;
    });

    this.loading.set(key, promise);
    return promise;
  }

  preload(assets) {
    return Promise.all(
      assets.map(({ key, loader }) => this.load(key, loader))
    );
  }

  unload(key) {
    const asset = this.cache.get(key);
    if (asset && asset.dispose) {
      asset.dispose();
    }
    this.cache.delete(key);
  }

  clear() {
    this.cache.forEach((asset, key) => this.unload(key));
    this.cache.clear();
  }
}
```

**Beneficio**: Inicio más rápido, menos memoria

### 5. Virtual Scrolling

**Problema**: Renderizar miles de items es lento
**Solución**: Solo renderizar lo visible

```javascript
import { FlatList } from 'react-native';

function DialogueList({ dialogues }) {
  const renderItem = useCallback(({ item }) => (
    <DialogueItem dialogue={item} />
  ), []);

  const keyExtractor = useCallback(
    (item, index) => `dialogue_${item.id || index}`,
    []
  );

  return (
    <FlatList
      data={dialogues}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={5}
    />
  );
}
```

**Beneficio**: Renderizar solo 5-10 items en vez de 1000

### 6. Debouncing y Throttling

**Problema**: Eventos de alta frecuencia (scroll, drag)
**Solución**: Limitar frecuencia de ejecución

```javascript
import { useCallback } from 'react';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

function OptimizedInput() {
  // Debounce: Ejecutar después de inactividad
  const debouncedSearch = useCallback(
    debounce((text) => {
      performSearch(text);
    }, 300),
    []
  );

  // Throttle: Ejecutar máximo cada X ms
  const throttledScroll = useCallback(
    throttle((event) => {
      handleScroll(event);
    }, 16), // ~60fps
    []
  );

  return <ScrollView onScroll={throttledScroll} />;
}
```

**Beneficio**: Menos trabajo, mejor responsividad

### 7. Animation Frame Batching

**Problema**: Múltiples actualizaciones por frame
**Solución**: Batch de updates

```javascript
class AnimationBatcher {
  constructor() {
    this.pending = [];
    this.scheduled = false;
  }

  schedule(callback) {
    this.pending.push(callback);

    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }

  flush() {
    const callbacks = this.pending;
    this.pending = [];
    this.scheduled = false;

    // Ejecutar todos los callbacks en un solo frame
    callbacks.forEach(cb => cb());
  }
}

const batcher = new AnimationBatcher();

// Uso
function updateMultiple() {
  batcher.schedule(() => updateObject1());
  batcher.schedule(() => updateObject2());
  batcher.schedule(() => updateObject3());
  // Todos se ejecutan en el mismo frame
}
```

**Beneficio**: Menos frames desperdiciados

## Patrones Anti-Performance

### ❌ No Hacer: Crear funciones en render

```javascript
// MAL
function Component() {
  return <Button onPress={() => doSomething()} />;
}

// BIEN
function Component() {
  const handlePress = useCallback(() => doSomething(), []);
  return <Button onPress={handlePress} />;
}
```

### ❌ No Hacer: Operaciones pesadas en render

```javascript
// MAL
function Component({ data }) {
  const processed = data.map(heavyOperation); // ¡Cada render!
  return <List items={processed} />;
}

// BIEN
function Component({ data }) {
  const processed = useMemo(
    () => data.map(heavyOperation),
    [data]
  );
  return <List items={processed} />;
}
```

### ❌ No Hacer: Logs en loops

```javascript
// MAL
function update(deltaTime) {
  entities.forEach(entity => {
    console.log('Updating', entity.id); // ¡Lento!
    entity.update(deltaTime);
  });
}

// BIEN
function update(deltaTime) {
  entities.forEach(entity => {
    entity.update(deltaTime);
  });
}
```

### ❌ No Hacer: Operaciones síncronas bloqueantes

```javascript
// MAL
function loadAllAssets() {
  assets.forEach(asset => {
    loadAssetSync(asset); // Bloquea UI
  });
}

// BIEN
async function loadAllAssets() {
  await Promise.all(
    assets.map(asset => loadAssetAsync(asset))
  );
}
```

## Benchmarking

### Medir Performance

```javascript
import { PerformanceObserver, performance } from 'perf_hooks';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  start(label) {
    this.metrics.set(label, performance.now());
  }

  end(label) {
    const start = this.metrics.get(label);
    if (!start) return;

    const duration = performance.now() - start;
    console.log(`${label}: ${duration.toFixed(2)}ms`);
    this.metrics.delete(label);

    return duration;
  }

  measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  async measureAsync(label, fn) {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

// Uso
const monitor = new PerformanceMonitor();

monitor.start('cinematic_load');
await loadCinematic();
monitor.end('cinematic_load');

// O
monitor.measure('animation_update', () => {
  animationEngine.update(deltaTime);
});
```

### React Native Performance Monitor

```javascript
import { useEffect, useRef } from 'react';

function usePerformance(componentName) {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const elapsed = Date.now() - startTime.current;

    if (__DEV__) {
      console.log(
        `${componentName} - Renders: ${renderCount.current}, ` +
        `Time: ${elapsed}ms, ` +
        `Avg: ${(elapsed / renderCount.current).toFixed(2)}ms`
      );
    }
  });
}

// Uso
function MyComponent() {
  usePerformance('MyComponent');
  return <View />;
}
```

## Targets de Performance

### Móviles

| Métrica | Target | Crítico |
|---------|--------|---------|
| FPS | 60 | > 30 |
| Frame Time | < 16ms | < 33ms |
| Startup Time | < 2s | < 5s |
| Memory | < 200MB | < 500MB |
| Bundle Size | < 10MB | < 20MB |

### Cinemáticas

| Operación | Target |
|-----------|--------|
| Load Cinematic | < 500ms |
| Start Playback | < 100ms |
| Frame Update | < 10ms |
| Timeline Seek | < 50ms |
| Asset Load | < 1s |

## Herramientas de Profiling

### 1. React DevTools Profiler

```bash
npm install -g react-devtools
react-devtools
```

### 2. Flipper

```bash
npm install react-native-flipper
```

### 3. Chrome DevTools

- Usar Chrome Inspector para CPU profiling
- Memory snapshots para detectar leaks

### 4. Expo Development Build

```bash
expo install expo-dev-client
```

## Checklist de Optimización

### Antes de Lanzar

- [ ] Eliminar todos los `console.log` en producción
- [ ] Habilitar Hermes engine
- [ ] Minimizar bundle con ProGuard (Android)
- [ ] Optimizar imágenes (WebP, PNG comprimidos)
- [ ] Lazy load de pantallas/features
- [ ] Code splitting
- [ ] Asset bundling eficiente
- [ ] Tree shaking configurado
- [ ] Source maps habilitados (para debugging)

### Performance Monitoring

```javascript
// Agregar a producción
import { reportWebVitals } from './vitals';

reportWebVitals((metric) => {
  // Enviar a analytics
  console.log(metric);
});
```

## Conclusión

El sistema de cinemáticas está diseñado para ser performante por defecto:

1. **Animaciones en UI thread** (Reanimated)
2. **Object pooling** para efectos/partículas
3. **Lazy loading** de assets
4. **Memoization** extensiva
5. **Virtual scrolling** para listas
6. **Batch updates** en timelines
7. **Event bus optimizado** sin leaks

Sigue estas guías y tu juego correrá a 60 FPS incluso en dispositivos de gama media.
