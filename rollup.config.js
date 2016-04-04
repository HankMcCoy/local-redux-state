import babel from 'rollup-plugin-babel';

export default {
  dest: 'dist/index.js',
  entry: 'src/index.js',
  format: 'cjs',
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
  ],
};
