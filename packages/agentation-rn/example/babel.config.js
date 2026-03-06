const { inspectorBabelPlugin } = require('react-native-dev-inspector/metro');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Pause state instrumentation (MUST be first)
      'reanimated-pause-state/babel',
      // Injects __callerSource prop into JSX elements with file, line, and column info
      inspectorBabelPlugin,
      // Reanimated must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
