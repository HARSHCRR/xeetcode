import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      // Monaco's prebuilt bundle is copied in at build time. Linting 27MB of
      // minified vendor JS exhausts the heap and tells us nothing.
      'public/monaco/**',
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
];

export default config;
