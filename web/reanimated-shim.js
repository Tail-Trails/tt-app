// Minimal shim for react-native-reanimated on web builds.
// This prevents webpack from throwing "Module not found" when optional
// requires are used inside native-only packages (e.g. react-native-gesture-handler).
// The shim intentionally provides an empty object; if your app uses
// reanimated-specific APIs on web this will not implement them.
module.exports = {};
module.exports.default = module.exports;
