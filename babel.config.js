module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin debe ir al final
      'react-native-reanimated/plugin',
    ],
  };
};
