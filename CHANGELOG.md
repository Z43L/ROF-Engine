# Changelog

All notable changes to ROF-Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-01

### Added
- **Complete UISystem** with full animation, transitions, and interactivity
  - Animated transitions (fade, slide, scale)
  - Focus navigation system (keyboard/gamepad)
  - Overlay system for modals
  - Interactive elements (buttons, hover effects)
  - React integration with hooks and components

- **Advanced Physics System** with professional features
  - Character Controller for smooth player movement
  - Triggers system for collision detection without blocking
  - Physics Materials with customizable friction and restitution
  - Joints system (fixed, ball, hinge joints)
  - Collision callbacks and events

- **Post-Processing Effects** for AAA visual quality
  - Bloom effect (bright light glow)
  - SSAO (Screen Space Ambient Occlusion)
  - Motion Blur
  - Depth of Field
  - Chromatic Aberration
  - Noise, Sepia, Grayscale effects
  - Vignette
  - Tone Mapping
  - SMAA anti-aliasing
  - Gamma Correction

- **Testing Suite** with comprehensive test coverage
  - Jest configuration
  - Unit tests for UISystem
  - Unit tests for InputSystem
  - Unit tests for AssetSystem
  - Mock environment setup
  - TypeScript definitions

- **UI Component Library**
  - Button component with states (hover, pressed, disabled)
  - Text component with styling options
  - Image component with aspect ratio preservation
  - Modal component with overlay
  - Slider component
  - Progress Bar component
  - Panel component

- **React Integration**
  - UISystemProvider with context
  - useUISystem() hook
  - Ready-to-use React components (UIButton, UIText, UIImage, etc.)
  - Event system integration

- **Build System**
  - Rollup configuration for ESM and CJS bundles
  - TypeScript support with declaration files
  - Tree-shaking optimization
  - Terser minification
  - Peer dependencies configuration

### Changed
- Updated package.json with proper npm configuration
- Improved project structure with modular exports
- Updated version to 1.0.0 (major release)
- Renamed package to `rof-engine` (from `reinado-olvidado`)

### Technical Details
- Full ES6 modules with proper exports
- Compatible with React 18+, React Native 0.70+, Three.js 0.160+
- Optional peer dependencies for React and React Native
- Supports Web, Native, and Expo platforms
- ECS (Entity-Component-System) architecture

### Performance
- Optimized bundle size with tree-shaking
- Lazy loading of platform-specific adapters
- Efficient post-processing pipeline
- Object pooling for performance-critical operations

## [0.1.0] - 2024-10-31

### Added
- Initial prototype version
- Basic ECS architecture
- Core engine components
- Basic input and audio systems
- Project scaffold

---

For more details, visit: https://github.com/tu-usuario/reinado-olvidado
