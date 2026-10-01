// Web-target fix (QA finding GRW-01, 2026-09-29).
// Web bundle crashed with "SyntaxError: Cannot use 'import.meta' outside a module"
// because zustand's ESM build (esm/middleware.mjs, selected on web via the
// `import` export condition) references `import.meta.env`, and babel-preset-expo
// only polyfills `import.meta` when `unstable_transformImportMeta` is enabled.
// Native (ios/android) resolves zustand via the `react-native` condition → CJS,
// so this only affects the web target.
const path = require('path');

module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo is nested under expo/node_modules in this lockfile, so
  // resolve it relative to the expo package rather than the project root.
  const preset = require.resolve('babel-preset-expo', {
    paths: [path.dirname(require.resolve('expo/package.json'))],
  });
  return {
    presets: [[preset, { unstable_transformImportMeta: true }]],
  };
};
