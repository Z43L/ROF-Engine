/**
 * Platform Detection Utility
 * Detecta la plataforma actual y proporciona helpers para código específico de plataforma
 */

const Platform = {
  /**
   * Verifica si estamos en un navegador web
   */
  get isWeb() {
    return typeof window !== 'undefined' &&
           typeof document !== 'undefined' &&
           !this.isNative;
  },

  /**
   * Verifica si estamos en React Native
   */
  get isNative() {
    return typeof navigator !== 'undefined' &&
           navigator.product === 'ReactNative';
  },

  /**
   * Verifica si estamos en Expo
   */
  get isExpo() {
    try {
      return typeof expo !== 'undefined' ||
             (typeof global !== 'undefined' && global.__expo);
    } catch {
      return false;
    }
  },

  /**
   * Verifica si estamos en iOS
   */
  get isIOS() {
    if (!this.isNative) return false;
    return global.Platform?.OS === 'ios';
  },

  /**
   * Verifica si estamos en Android
   */
  get isAndroid() {
    if (!this.isNative) return false;
    return global.Platform?.OS === 'android';
  },

  /**
   * Selector de valores según plataforma
   * @param {Object} options - Objeto con opciones por plataforma
   * @returns El valor correspondiente a la plataforma actual
   *
   * @example
   * const value = Platform.select({
   *   web: 'Web Value',
   *   native: 'Native Value',
   *   expo: 'Expo Value',
   *   ios: 'iOS Value',
   *   android: 'Android Value',
   *   default: 'Default Value'
   * });
   */
  select(options) {
    if (this.isIOS && options.ios !== undefined) {
      return options.ios;
    }
    if (this.isAndroid && options.android !== undefined) {
      return options.android;
    }
    if (this.isExpo && options.expo !== undefined) {
      return options.expo;
    }
    if (this.isNative && options.native !== undefined) {
      return options.native;
    }
    if (this.isWeb && options.web !== undefined) {
      return options.web;
    }
    return options.default;
  },

  /**
   * Obtiene información sobre la plataforma
   */
  get info() {
    return {
      isWeb: this.isWeb,
      isNative: this.isNative,
      isExpo: this.isExpo,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      platform: this.isWeb ? 'web' :
                this.isIOS ? 'ios' :
                this.isAndroid ? 'android' : 'unknown'
    };
  }
};

export default Platform;
