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
    // Provide a shim for nanoid to avoid ESM/CJS interop issues in the web bundle
    'nanoid': path.resolve(__dirname, 'web', 'nanoid-shim.js'),
    // Some consumers import the non-secure submodule directly (e.g. expo-router)
    // Point to a local copy so webpack doesn't need to resolve the package subpath.
    'nanoid/non-secure': path.resolve(__dirname, 'web', 'nanoid-non-secure.js'),
  };

  // Define the EXPO_ROUTER_APP_ROOT env var so expo-router can find the app directory
  config.plugins = config.plugins || [];
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.EXPO_ROUTER_APP_ROOT': JSON.stringify('app'),
    })
  );

  // Ensure any imports of nanoid or its subpath are rewritten to our local shims.
  // NormalModuleReplacementPlugin is used to catch requests originating from
  // inside node_modules where alias resolution may be skipped or modified.
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/nanoid\/non-secure/, path.resolve(__dirname, 'web', 'nanoid-non-secure.js')),
    new webpack.NormalModuleReplacementPlugin(/^nanoid$/, path.resolve(__dirname, 'web', 'nanoid-shim.js'))
  );

  // You can customize the webpack config here if needed
  // e.g. add aliases, modify loaders, plugins, etc.

  return config;
};
