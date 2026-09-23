/**
 * Babel config dedicada a jest.
 * El babel.config.js de la raíz está pensado para Metro/Expo;
 * para los tests basta con transformar ESM -> CJS en Node.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }]
  ]
};
