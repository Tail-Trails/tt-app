const path = require('path');
const webpack = require('webpack');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  // Get the default config from Expo
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Ensure imports like 'app' resolve to the project's app/ folder for expo-router
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    app: path.resolve(__dirname, 'app'),
    // expo-router (and other packages) sometimes import the app folder using
    // deeply-nested relative paths from within node_modules. Provide aliases for
    // common depths so webpack can resolve them to the project's `app/` folder.
    '../../../../../../app': path.resolve(__dirname, 'app'),
  '../../../../../../../app': path.resolve(__dirname, 'app'),
    '../../../../../app': path.resolve(__dirname, 'app'),
    '../../../../app': path.resolve(__dirname, 'app'),
    '../../../app': path.resolve(__dirname, 'app'),
    '@': path.resolve(__dirname),
    // Shim native-only modules on web to avoid bundling errors
    'lottie-react-native': path.resolve(__dirname, 'web', 'shims', 'lottie-shim.js'),
    '@react-native-firebase/app': path.resolve(__dirname, 'web', 'shims', 'rn-firebase-shim.js'),
    '@react-native-firebase/auth': path.resolve(__dirname, 'web', 'shims', 'rn-firebase-shim.js'),
    // Provide a shim for nanoid to avoid ESM/CJS interop issues in the web bundle
    'nanoid': path.resolve(__dirname, 'web', 'nanoid-shim.js'),
    // Some consumers import the non-secure submodule directly (e.g. expo-router)
    // Point to a local copy so webpack doesn't need to resolve the package subpath.
    'nanoid/non-secure': path.resolve(__dirname, 'web', 'nanoid-non-secure.js'),
    'react-native-reanimated': path.resolve(__dirname, 'web', 'reanimated-shim.js'),
  };

  // Define the EXPO_ROUTER_APP_ROOT env var so expo-router can find the app directory
  config.plugins = config.plugins || [];
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.EXPO_ROUTER_APP_ROOT': JSON.stringify('app'),
      // Expose EXPO_PUBLIC_API_URL to the web bundle so client code can read it at runtime.
      'process.env.EXPO_PUBLIC_API_URL': JSON.stringify(process.env.EXPO_PUBLIC_API_URL || ''),
    })
  );

  // Ensure any imports of nanoid or its subpath are rewritten to our local shims.
  // NormalModuleReplacementPlugin is used to catch requests originating from
  // inside node_modules where alias resolution may be skipped or modified.
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/nanoid\/non-secure/, path.resolve(__dirname, 'web', 'nanoid-non-secure.js')),
    new webpack.NormalModuleReplacementPlugin(/^nanoid$/, path.resolve(__dirname, 'web', 'nanoid-shim.js'))
  );

  // Replace some native-only modules or internal react-native paths with web shims
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/^lottie-react-native$/, path.resolve(__dirname, 'web', 'shims', 'lottie-shim.js')),
    new webpack.NormalModuleReplacementPlugin(/^@react-native-firebase\/app$/, path.resolve(__dirname, 'web', 'shims', 'rn-firebase-shim.js')),
    new webpack.NormalModuleReplacementPlugin(/^@react-native-firebase\/auth$/, path.resolve(__dirname, 'web', 'shims', 'rn-firebase-shim.js')),
    new webpack.NormalModuleReplacementPlugin(/react-native\/Libraries\/vendor\/emitter\/EventEmitter/, path.resolve(__dirname, 'web', 'shims', 'EventEmitter.js'))
  );

  // You can customize the webpack config here if needed
  // e.g. add aliases, modify loaders, plugins, etc.

  return config;
};
