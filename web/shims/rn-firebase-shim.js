// Shim for @react-native-firebase packages when bundling for web.
// This prevents the web bundle from trying to resolve native modules.
function notAvailable() {
  throw new Error('@react-native-firebase is not available in web builds.');
}

// Support both require() and import default behaviors
module.exports = notAvailable;
module.exports.default = notAvailable;
