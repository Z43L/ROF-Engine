/**
 * Rollup Configuration for ROF-Engine
 * Configuración de build para generar bundles optimizados
 */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

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
    external: [...Object.keys(pkg.peerDependencies || {})],
    plugins: [
      peerDepsExternal(),
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false
      }),
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
      ...Object.keys(pkg.peerDependencies || {}),
      'react',
      'react-dom',
      'react/jsx-runtime'
    ],
    plugins: [
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      }),
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
      ...Object.keys(pkg.peerDependencies || {}),
      'three'
    ],
    plugins: [
      resolve({
        extensions: ['.js', '.jsx']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      }),
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
      ...Object.keys(pkg.peerDependencies || {}),
      'react'
    ],
    plugins: [
      resolve({
        extensions: ['.js', '.jsx']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      }),
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
      ...Object.keys(pkg.peerDependencies || {}),
      'three'
    ],
    plugins: [
      resolve({
        extensions: ['.js', '.jsx']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      }),
      terser()
    ]
  },

  // Type definitions
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    plugins: [
      dts({
        respectExternal: true
      })
    ],
    external: [...Object.keys(pkg.peerDependencies || {})]
  }
];