/**
 * Rollup Configuration for ROF-Engine
 * Configuración de build para generar bundles optimizados
 */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

// Deps de runtime que se importan de forma dinámica y deben quedar externas
// en el dist (npm las instala al ser dependencies/peerDependencies declaradas)
const runtimeExternal = [
  ...Object.keys(pkg.peerDependencies || {}),
  'postprocessing',
  '@dimforge/rapier3d-compat'
];

// Babel para transformar el JSX de los componentes React (runtime automático).
// configFile/babelrc desactivados: el babel.config.js de la raíz es para
// Metro/Expo (CJS) y no debe mezclarse con el build de rollup.
const babelReact = () => babel({
  babelHelpers: 'bundled',
  extensions: ['.js', '.jsx'],
  exclude: 'node_modules/**',
  configFile: false,
  babelrc: false,
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }]
  ]
});

export default [
  // Main bundle - ESM y CJS
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true,
        banner: '/* ROF-Engine v' + pkg.version + ' */'
      },
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
        banner: '/* ROF-Engine v' + pkg.version + ' */'
      }
    ],
    external: [...runtimeExternal, 'react/jsx-runtime'],
    plugins: [
      peerDepsExternal(),
      babelReact(),
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false
        }
      })
    ],
    treeshake: {
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    }
  },

  // React components bundle
  {
    input: 'src/react/index.js',
    output: {
      file: 'dist/react/index.js',
      format: 'esm',
      sourcemap: true
    },
    external: [
      ...runtimeExternal,
      'react',
      'react-dom',
      'react/jsx-runtime'
    ],
    plugins: [
      peerDepsExternal(),
      babelReact(),
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }),
      commonjs(),
      terser()
    ]
  },

  // Systems bundle
  {
    input: 'src/systems/index.js',
    output: {
      file: 'dist/systems/index.js',
      format: 'esm',
      sourcemap: true
    },
    external: [
      ...runtimeExternal,
      'three'
    ],
    plugins: [
      peerDepsExternal(),
      babelReact(),
      resolve({
        extensions: ['.js', '.jsx']
      }),
      commonjs(),
      terser()
    ]
  },

  // Components bundle
  {
    input: 'src/components/index.js',
    output: {
      file: 'dist/components/index.js',
      format: 'esm',
      sourcemap: true
    },
    external: [
      ...runtimeExternal,
      'react',
      'react/jsx-runtime'
    ],
    plugins: [
      peerDepsExternal(),
      babelReact(),
      resolve({
        extensions: ['.js', '.jsx']
      }),
      commonjs(),
      terser()
    ]
  },

  // Cinematic system bundle
  {
    input: 'src/cinematic/index.js',
    output: {
      file: 'dist/cinematic/index.js',
      format: 'esm',
      sourcemap: true
    },
    external: [
      ...runtimeExternal,
      'three',
      'react/jsx-runtime'
    ],
    plugins: [
      peerDepsExternal(),
      babelReact(),
      resolve({
        extensions: ['.js', '.jsx']
      }),
      commonjs(),
      terser()
    ]
  },

  // Type definitions (generadas desde el JS con JSDoc vía allowJs)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    plugins: [
      dts({
        respectExternal: true,
        tsconfig: './tsconfig.dts.json'
      })
    ],
    external: runtimeExternal
  }
];