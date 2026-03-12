// Minimal shim for react-native-reanimated on web
// Exports an empty object and no-op methods used by some libraries.
module.exports = {
  // provide a minimal `useSharedValue`/`useAnimatedStyle` API if needed
  __esModule: true,
  default: {},
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: (fn) => fn && fn(),
  withTiming: (v) => v,
  withSpring: (v) => v,
  Easing: { linear: (t) => t },
};
