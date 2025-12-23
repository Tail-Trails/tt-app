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
  };

  // Define the EXPO_ROUTER_APP_ROOT env var so expo-router can find the app directory
  config.plugins = config.plugins || [];
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.EXPO_ROUTER_APP_ROOT': JSON.stringify('app'),
    })
  );

  // You can customize the webpack config here if needed
  // e.g. add aliases, modify loaders, plugins, etc.

  return config;
};
