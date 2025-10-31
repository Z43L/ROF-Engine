/**
 * ExpoInputAdapter
 * Adaptador de input para Expo
 * Usa React Native Gesture Handler y añade funcionalidad específica de Expo
 */

import NativeInputAdapter from '../native/NativeInputAdapter.js';

class ExpoInputAdapter extends NativeInputAdapter {
  constructor(config = {}) {
    super(config);
    this.useHaptics = config.useHaptics !== false;
  }

  init(state, emitter) {
    super.init(state, emitter);
    this._setupExpoFeatures();
  }

  async _setupExpoFeatures() {
    // Inicializar Haptic Feedback si está disponible
    if (this.useHaptics) {
      try {
        const { default: Haptics } = await import('expo-haptics');
        this.haptics = Haptics;
      } catch (error) {
        console.warn('Expo Haptics not available:', error);
      }
    }
  }

  /**
   * Proporciona feedback háptico
   */
  async vibrate(type = 'light') {
    if (!this.haptics) return;

    try {
      switch (type) {
        case 'light':
          await this.haptics.impactAsync(this.haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await this.haptics.impactAsync(this.haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await this.haptics.impactAsync(this.haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await this.haptics.notificationAsync(this.haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await this.haptics.notificationAsync(this.haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await this.haptics.notificationAsync(this.haptics.NotificationFeedbackType.Error);
          break;
        default:
          await this.haptics.selectionAsync();
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Sobrescribir métodos para añadir haptic feedback
  _setupPanResponder() {
    super._setupPanResponder();

    // Wrapper para añadir haptics
    const originalGrant = this.panResponder._responder.onPanResponderGrant;
    this.panResponder._responder.onPanResponderGrant = (evt, gestureState) => {
      this.vibrate('light');
      return originalGrant(evt, gestureState);
    };
  }
}

export default ExpoInputAdapter;
