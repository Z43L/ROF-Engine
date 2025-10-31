const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Agregar extensiones adicionales
config.resolver.sourceExts.push('cjs');

// Configurar aliases para paths
config.resolver.extraNodeModules = {
  '@': './src',
};

module.exports = config;
