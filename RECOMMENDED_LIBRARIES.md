# Librerías Recomendadas para el Sistema de Cinemáticas

## Core Dependencies (Ya instaladas)

```json
{
  "expo": "~54.0.13",
  "react": "19.1.0",
  "react-native": "0.81.4",
  "@react-three/fiber": "^9.3.0",
  "@react-three/drei": "^10.7.6",
  "three": "^0.180.0",
  "expo-three": "^8.0.0"
}
```

## Librerías Adicionales Recomendadas

### 1. Animaciones Nativas

```bash
# React Native Reanimated - Animaciones de alto performance
npx expo install react-native-reanimated

# React Native Gesture Handler - Para interacciones
npx expo install react-native-gesture-handler

# Expo GL - Para efectos visuales avanzados
npx expo install expo-gl
```

**¿Por qué?**
- `react-native-reanimated`: Animaciones que corren en el UI thread (60fps garantizado)
- `react-native-gesture-handler`: Gestos nativos para controles interactivos
- `expo-gl`: Shaders y efectos visuales personalizados

### 2. Audio y Sincronización

```bash
# Expo AV - Audio/Video completo
npx expo install expo-av

# Expo Audio - Audio simple
npx expo install expo-audio

# React Native Track Player - Para música de fondo
npm install react-native-track-player
```

**¿Por qué?**
- `expo-av`: Sincronización precisa de audio con cinemáticas
- Callbacks de tiempo para eventos basados en audio
- Soporte para múltiples formatos

### 3. Efectos Visuales y Partículas

```bash
# React Three Fiber Postprocessing - Efectos visuales
npm install @react-three/postprocessing

# React Three Flex - Layouts 3D
npm install @react-three/flex

# Three.js addons
npm install three-stdlib
```

**¿Por qué?**
- Efectos de post-procesamiento (bloom, blur, etc.)
- Sistema de partículas avanzado
- Shaders personalizados

### 4. State Management y Eventos

```bash
# Zustand - State management ligero
npm install zustand

# Mitt - Event emitter ligero (alternativa)
npm install mitt

# Immer - Immutable state (opcional)
npm install immer
```

**¿Por qué?**
- Zustand: Estado global para cinemáticas
- Mitt: Event bus alternativo más ligero
- Immer: Actualizaciones inmutables fáciles

### 5. Utilidades

```bash
# Lodash - Utilidades generales
npm install lodash

# Date-fns - Manejo de tiempo
npm install date-fns

# React Use - Hooks útiles
npm install react-use
```

### 6. Desarrollo y Debug

```bash
# React DevTools
npm install react-devtools

# Flipper para debugging
npm install react-native-flipper

# Performance monitoring
npm install @shopify/react-native-performance
```

## Instalación Completa

```bash
# Instalar todas las dependencias core
npx expo install \
  react-native-reanimated \
  react-native-gesture-handler \
  expo-gl \
  expo-av

# Instalar librerías adicionales
npm install \
  @react-three/postprocessing \
  three-stdlib \
  zustand \
  lodash \
  date-fns
```

## Configuración Necesaria

### 1. React Native Reanimated

Agregar al `babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin'
    ],
  };
};
```

### 2. Gesture Handler

Agregar al `App.js`:

```javascript
import 'react-native-gesture-handler';
```

## Alternativas según Necesidades

### Si NO necesitas 3D avanzado:

```bash
# Solo animaciones 2D
npx expo install react-native-reanimated
npm install @shopify/react-native-skia  # Para gráficos 2D de alto rendimiento
```

### Si necesitas Video:

```bash
npx expo install expo-video
# o
npm install react-native-video
```

### Si necesitas Físicas:

```bash
npm install @react-three/cannon  # Físicas 3D
npm install matter-js  # Físicas 2D
```

### Si necesitas Networking (multiplayer):

```bash
npm install socket.io-client
npm install colyseus.js
```

## Librerías Opcionales (Avanzadas)

### 1. Machine Learning

```bash
npx expo install expo-camera
npm install @tensorflow/tfjs
npm install @tensorflow/tfjs-react-native
```

### 2. AR/VR

```bash
npx expo install expo-gl
npm install expo-three
npm install @react-three/xr
```

### 3. Mapas y Ubicación

```bash
npx expo install expo-location
npx expo install react-native-maps
```

## package.json Recomendado Final

```json
{
  "name": "reinadoolvidado",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    // Existentes
    "expo": "~54.0.13",
    "expo-status-bar": "~3.0.8",
    "react": "19.1.0",
    "react-native": "0.81.4",

    // Three.js
    "@react-three/fiber": "^9.3.0",
    "@react-three/drei": "^10.7.6",
    "@react-three/postprocessing": "^2.16.0",
    "three": "^0.180.0",
    "three-stdlib": "^2.29.0",
    "expo-three": "^8.0.0",

    // Animaciones
    "react-native-reanimated": "~3.6.2",
    "react-native-gesture-handler": "~2.14.0",

    // Audio
    "expo-av": "~14.0.5",

    // State & Utils
    "zustand": "^4.5.0",
    "lodash": "^4.17.21",
    "date-fns": "^3.0.0",

    // GL
    "expo-gl": "~14.0.2"
  },
  "devDependencies": {
    "@babel/core": "^7.23.0"
  },
  "private": true
}
```

## Consideraciones de Bundle Size

### Para reducir el tamaño:

1. **Usar imports específicos:**
   ```javascript
   // ❌ Evitar
   import _ from 'lodash';

   // ✅ Mejor
   import debounce from 'lodash/debounce';
   ```

2. **Tree shaking:**
   ```javascript
   // ❌ Evitar
   import * as THREE from 'three';

   // ✅ Mejor
   import { Mesh, BoxGeometry } from 'three';
   ```

3. **Code splitting:**
   ```javascript
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

## Performance Tips

1. **Usar worklets con Reanimated:**
   ```javascript
   'worklet';
   function animation(value) {
     // Corre en UI thread
   }
   ```

2. **Memoizar componentes pesados:**
   ```javascript
   const HeavyComponent = React.memo(Component);
   ```

3. **Lazy load de assets:**
   ```javascript
   const [assets] = useAssets([require('./heavy-asset.png')]);
   ```

## Testing

```bash
# Testing
npm install --save-dev jest
npm install --save-dev @testing-library/react-native
npm install --save-dev @testing-library/jest-native

# E2E Testing
npm install --save-dev detox
```

## Documentación Útil

- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Three.js](https://threejs.org/docs/)
